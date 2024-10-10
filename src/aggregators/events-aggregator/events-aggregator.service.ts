import { Injectable, Logger } from "@nestjs/common";
import { EvmConnectorService } from "../../blockchain-connectors/evm-connector/evm-connector.service";
import { CronExpression, SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";
import {
  RewardsConvertedToUsdcAbiEvent,
  SingleLogEvent,
  isRewardsConvertedToUsdcEvent,
} from "../../shared/models/Types";
import { LOGS_MAX_BLOCK_RANGE } from "../../shared/constants";
import { Address } from "viem";
import { WeweConfigService } from "../../config/wewe-data-aggregator-config.service";
import { ProgressMetadataDbService } from "../../database/progress-metadata/progress-metadata-db.service";
import { ProgressMetadataDto } from "../../database/db-models";
import { AggregationType } from "../../shared/enum/AggregationType";
import { FeeManagerEventsHelperService } from "./events-aggregator-helpers/fee-manager-events-helper.service";

@Injectable()
export class EventsAggregatorService {
  constructor(
    private evmConnector: EvmConnectorService,
    private configService: WeweConfigService,
    private logger: Logger,
    private schedulerRegistry: SchedulerRegistry,
    private feeManagerEventsHelperService: FeeManagerEventsHelperService,
    private progressMetadataDb: ProgressMetadataDbService,
  ) {}

  /**
   * Aggregate events by synchronizing aup until now and scheduling hourly sync job.
   */
  public async aggregateEvents(): Promise<void> {
    if (this.configService.allPortfolioAddresses.length > 0) {
      // sync all events from last sync block numbers to the current one
      this.logger.log("Syncing all events...");
      await this.syncAllEvents();

      // after events are synced, schedule hourly sync job
      this.scheduleHourlySyncJob();
    }
  }

  /**
   * Schedule a job to synchronize events every hour.
   */
  private scheduleHourlySyncJob(): void {
    // hourly sync job ensures no events were missed
    const jobName = EventsAggregatorService.name + "-hourlySyncJob";

    // only add cron job if it does not exist
    if (!this.schedulerRegistry.doesExist("cron", jobName)) {
      const job = new CronJob(CronExpression.EVERY_HOUR, () => this.syncAllEvents());

      this.schedulerRegistry.addCronJob(jobName, job);
      job.start();

      this.logger.debug("[EventsAggregatorService] Scheduled syncAllEventsJob to run every hour!");
    }
  }

  /**
   * Synchronize all events from the last synchronized block number to the current block number.
   */
  private async syncAllEvents(): Promise<void> {
    // fetch recent block number
    const recentBlockNumber = (await this.evmConnector.getCurrentBlockNumber()) - 1n;

    // get the lowest FROM block from all addresses
    let lowestFromBlock: bigint | undefined = undefined;
    const fromBlocks = await this.getLowestFromBlocks();
    fromBlocks.forEach((fromBlock) => {
      if (lowestFromBlock === undefined || fromBlock < lowestFromBlock) {
        lowestFromBlock = fromBlock;
      }
    });

    // if lowestFromBlock is still undefined we have nothing to fetch
    if (lowestFromBlock == undefined) {
      this.logger.warn("lowestFromBlock is still undefined we have nothing to fetch");
      return;
    }

    let toBlock =
      lowestFromBlock + LOGS_MAX_BLOCK_RANGE < recentBlockNumber
        ? lowestFromBlock + LOGS_MAX_BLOCK_RANGE
        : recentBlockNumber;

    const addresses = [this.configService.feeManagerAddress];

    this.logger.log(`Fetching events from ${lowestFromBlock} to ${toBlock}. Recent block: ${recentBlockNumber}`);

    // fetch logs for logs max block range
    while (lowestFromBlock < recentBlockNumber && toBlock <= recentBlockNumber) {
      const logs = (
        await this.evmConnector.client.getLogs({
          events: [RewardsConvertedToUsdcAbiEvent],
          fromBlock: lowestFromBlock,
          toBlock: toBlock,
          address: addresses,
          strict: true,
        })
      ).sort((a, b) => Number(a.blockNumber) - Number(b.blockNumber));

      await this.processLogs(logs);

      // check if we've finished
      if (toBlock == recentBlockNumber) {
        //save progress here in case we do not enter specific handler method before
        const savePromises = addresses.map((address) => this.saveProgress(address, toBlock));
        await Promise.all(savePromises);
        break;
      }

      lowestFromBlock = toBlock + 1n;
      toBlock =
        lowestFromBlock + LOGS_MAX_BLOCK_RANGE < recentBlockNumber
          ? lowestFromBlock + LOGS_MAX_BLOCK_RANGE
          : recentBlockNumber;
    }
  }

  /**
   * Process logs and handle events accordingly.
   */
  private async processLogs(logs: SingleLogEvent[]): Promise<void> {
    const processingPromises = logs.map((log) => this.getHandlerMethod(log));
    await Promise.all(processingPromises);
  }

  /**
   * Get the appropriate handler method for the log and process the event.
   */
  private async getHandlerMethod(log: SingleLogEvent) {
    // handle the logs (derive log type, then call a specific operation handling method)
    if (isRewardsConvertedToUsdcEvent(log)) {
      const exists = await this.feeManagerEventsHelperService.checkIfEntryExists(log);
      if (!exists) {
        await this.feeManagerEventsHelperService.handleRewardsConvertedToUsdcEvent(log);
      } else {
        this.logger.debug(
          `Entry for address ${log.address} with hash ${log.transactionHash} already exists. Skipping.`,
        );
      }
    }
  }

  /**
   * Save progress metadata for each portfolio address and for all possible aggregation types of that specific product type.
   */
  private async saveProgress(address: Address, recentBlockNumber: bigint) {
    this.logger.log("Saving progress metadata", this.saveProgress.name);
    const addressLowerCase = address.toLowerCase();
    await this.progressMetadataDb.saveProgressMetadata(
      new ProgressMetadataDto(
        addressLowerCase,
        Number(recentBlockNumber),
        AggregationType.REWARDS_CONVERTED_TO_USDC_EVENT,
      ),
    );
  }

  private async getLowestFromBlocks(): Promise<Map<Address, bigint>> {
    return await this.feeManagerEventsHelperService.getFromBlocks();
  }
}
