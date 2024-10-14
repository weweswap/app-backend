import { Injectable, Logger } from "@nestjs/common";
import { EvmConnectorService } from "../../../blockchain-connectors/evm-connector/evm-connector.service";
import { RewardsConvertedToUsdcAbiEvent, SingleLogEvent } from "../../../shared/models/Types";
import { Address, GetLogsReturnType } from "viem";
import { RewardsConvertedToUsdcEventDto, RewardsConvertedToUsdcEventMetadataDto } from "../../../database/db-models";
import { WeweConfigService } from "../../../config/wewe-data-aggregator-config.service";
import { ProgressMetadataDbService } from "../../../database/progress-metadata/progress-metadata-db.service";
import { AggregationType } from "../../../shared/enum/AggregationType";
import { FeeManagerContractsService } from "../../../contract-connectors/fee-manager-contracts/fee-manager-contracts.service";
import { RewardsConvertedToUsdcDbService } from "../../../database/rewards-usdc-db/rewards-usdc-db.service";

@Injectable()
export class FeeManagerEventsHelperService {
  private readonly logger = new Logger(FeeManagerEventsHelperService.name);

  constructor(
    private evmConnector: EvmConnectorService,
    private feeManagerContractService: FeeManagerContractsService,
    private configService: WeweConfigService,
    private rewardsDbService: RewardsConvertedToUsdcDbService,
    private progressMetadataDb: ProgressMetadataDbService,
  ) {}

  public async handleRewardsConvertedToUsdcEvent(
    log: GetLogsReturnType<typeof RewardsConvertedToUsdcAbiEvent>[number],
  ): Promise<void> {
    const eventId = log.transactionHash + log.logIndex;
    const timestamp = await this.evmConnector.getBlockTimestamp(log.blockNumber);
    const vaultAddress = await this.feeManagerContractService.getVaultAddress(log.address.toLowerCase() as Address);

    const rewardsConvertedToUsdcEvent = new RewardsConvertedToUsdcEventDto(
      eventId.toLowerCase(),
      new Date(Number(timestamp)),
      new RewardsConvertedToUsdcEventMetadataDto(
        vaultAddress,
        log.address.toLowerCase(),
        log.args.usdcAmount?.toString() ?? "0",
        Number(log.blockNumber),
        log.transactionHash,
      ),
    );

    await this.rewardsDbService.saveRewardsInUsdcEvent(rewardsConvertedToUsdcEvent);
  }

  public async checkIfEntryExists(log: SingleLogEvent) {
    const eventId = (log.transactionHash + log.logIndex).toLowerCase();
    const exists = await this.rewardsDbService.checkIfEntryExists(eventId);
    return exists;
  }

  public async getFromBlocks(): Promise<Map<Address, bigint>> {
    const fromBlocks = new Map<Address, bigint>();
    const arrakisConfigs = this.configService.arrakisVaultConfigs;

    for (const config of arrakisConfigs) {
      const lastProcessedBlock = await this.progressMetadataDb.getLastBlockNumber(
        config.feeManager,
        AggregationType.REWARDS_CONVERTED_TO_USDC_EVENT,
      );
      let fromBlock: bigint;
      if (lastProcessedBlock !== undefined) {
        fromBlock = lastProcessedBlock + 1n;
        this.logger.debug(
          `Retrieved lastProcessedBlock ${lastProcessedBlock} for address ${config.feeManager}, operation ${AggregationType.REWARDS_CONVERTED_TO_USDC_EVENT}. ` +
            `Setting fromBlock to ${fromBlock}.`,
        );
      } else {
        fromBlock = BigInt(config.startingBlock);
        this.logger.debug(
          `No lastProcessedBlock found for address ${config.feeManager}, operation ${AggregationType.REWARDS_CONVERTED_TO_USDC_EVENT}. ` +
            `Setting fromBlock to startingBlock ${fromBlock}.`,
        );
      }
      fromBlocks.set(config.address, fromBlock);
    }

    return fromBlocks;
  }
}
