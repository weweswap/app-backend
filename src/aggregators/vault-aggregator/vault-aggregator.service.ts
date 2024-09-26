import { Injectable, Logger } from "@nestjs/common";
import { VaultDbService } from "../../database/vault-db/vault-db.service";
import { DateTime } from "luxon";
import { ArrakisContractsService } from "../../contract-connectors/arrakis-contracts/arrakis-contracts.service";
import { MAX_CONSECUTIVE_RETRY, ONE_HOUR_IN_MILLISECONDS, TEN_SECONDS_IN_MILLISECONDS } from "../../shared/constants";
import { EvmConnectorService } from "../../blockchain-connectors/evm-connector/evm-connector.service";
import { ArrakisVaultConfig } from "../../shared/class/WeweDataAggregatorConfig";
import { VaultHistoricalDataDto, VaultHistoricalMetadataDto } from "../../shared/class/VaultHistoricalDataDto";
import { constructTimestamps } from "../../utils/aggregation-utils";
import { scheduleToTheNextFullHour } from "../../utils/utils";
import { WeweConfigService } from "../../config/wewe-data-aggregator-config.service";

@Injectable()
export class VaultAggregatorService {
  // counter responsible for adding up consecutive failures until we hit max limit
  private consecutiveFailCount = 0;

  constructor(
    private readonly logger: Logger,
    private vaultDbService: VaultDbService,
    private evmConnector: EvmConnectorService,
    private arrakisContractService: ArrakisContractsService,
    private configService: WeweConfigService,
  ) {}

  public async startAggregating(): Promise<void> {
    if (this.configService.arrakisVaultsAddresses.length > 0) {
      this.startHourlyArrakisVaultHistoricalAggregation();
    }
  }

  private async startHourlyArrakisVaultHistoricalAggregation(): Promise<void> {
    // start aggregation for each vault
    try {
      // concurrently sync all vaults data
      await Promise.all(this.configService.arrakisVaultConfigs.map(async (vault) => this.aggregateVaultsData(vault)));

      // reset consecutiveFailCount if aggregation succeeded
      this.consecutiveFailCount = 0;

      // if all vaults are synced, schedule next sync at next full hour
      scheduleToTheNextFullHour(() => this.startAggregating());
    } catch (e) {
      this.consecutiveFailCount++;

      // if aggregation failed more than <MAX_CONSECUTIVE_RETRY> times in a row, throw an error because something is very wrong
      if (this.consecutiveFailCount > MAX_CONSECUTIVE_RETRY) {
        throw e;
      }

      this.logger.error(
        `[VaultAggregatorService] Aggregation failed with error ${JSON.stringify(e, null, 2)}. Retrying in 10 seconds..`,
      );

      // catch error and retry aggregation in 10 seconds
      setTimeout(() => this.startAggregating(), TEN_SECONDS_IN_MILLISECONDS);
    }
  }

  private async aggregateVaultsData(vault: ArrakisVaultConfig): Promise<void> {
    // retrieve last time when aggregation happened
    let lastTimestampAggregated: number | bigint | undefined =
      await this.vaultDbService.getMostRecentVaultsDataTimestamp(vault.address);

    if (lastTimestampAggregated == undefined) {
      // if there is no last timestamp, derive the first timestamp from the starting block
      lastTimestampAggregated = await this.evmConnector.getBlockTimestamp(BigInt(vault.startingBlock));
    }

    this.logger.debug(
      `[VaultAggregatorService] ${vault.address} - lastTimestampAggregated: ${lastTimestampAggregated}`,
    );

    // calculate next hour from the last aggregation timestamp e.g.
    const startingHourToAggregateFrom: number = DateTime.fromMillis(Number(lastTimestampAggregated))
      .plus({ hour: 1 })
      .startOf("hour")
      .toMillis();

    const now: DateTime = DateTime.local();

    const hourlyTimestampsToProcess = constructTimestamps(
      startingHourToAggregateFrom,
      now.toMillis(),
      ONE_HOUR_IN_MILLISECONDS,
    );

    for (const timestamp of hourlyTimestampsToProcess) {
      const blockNumber = await this.evmConnector.getClosestBlocknumber(timestamp);

      const data: VaultHistoricalMetadataDto = await this.arrakisContractService.getVaultHistoricalData(
        vault,
        timestamp,
        blockNumber,
      );

      // save into DB
      await this.vaultDbService.saveVaultData(new VaultHistoricalDataDto(new Date(timestamp), data));

      this.logger.log(`Saved vault ${vault.address} data for ${DateTime.fromMillis(timestamp).toISO()}`);
    }
  }
}
