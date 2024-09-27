import { Injectable } from "@nestjs/common";
import { EvmConnectorService } from "../../../blockchain-connectors/evm-connector/evm-connector.service";
import { LpVaultCollectedFeesAbiEvent, SingleLogEvent } from "../../../shared/models/Types";
import { Address, GetLogsReturnType } from "viem";
import { CollectedVaultFeeEventDto, CollectedVaultFeeEventMetadataDto } from "../../../database/db-models";
import { VaultDbService } from "../../../database/vault-db/vault-db.service";
import { WeweConfigService } from "../../../config/wewe-data-aggregator-config.service";
import { ProgressMetadataDbService } from "../../../database/progress-metadata/progress-metadata-db.service";
import { AggregationType } from "../../../shared/enum/AggregationType";

@Injectable()
export class ArrakisOperationsHelperService {
  constructor(
    private evmConnector: EvmConnectorService,
    private configService: WeweConfigService,
    private vaultDbService: VaultDbService,
    private progressMetadataDb: ProgressMetadataDbService,
  ) {}

  public async handleLogCollectedFeeEvent(
    log: GetLogsReturnType<typeof LpVaultCollectedFeesAbiEvent>[number],
  ): Promise<void> {
    const eventId = log.transactionHash + log.logIndex;
    const timestamp = await this.evmConnector.getBlockTimestamp(log.blockNumber);

    const collctedFeeEvent = new CollectedVaultFeeEventDto(
      eventId.toLowerCase(),
      new Date(Number(timestamp)),
      new CollectedVaultFeeEventMetadataDto(
        log.address.toLowerCase(),
        log.args.fee0?.toString() ?? "0",
        log.args.fee1?.toString() ?? "0",
        Number(log.blockNumber),
        log.transactionHash,
      ),
    );

    await this.vaultDbService.saveCollectedFeeEvent(collctedFeeEvent);
  }

  public async checkIfEntryExists(log: SingleLogEvent) {
    const eventId = (log.transactionHash + log.logIndex).toLowerCase();
    const exists = await this.vaultDbService.checkIfEntryExists(eventId);
    return exists;
  }

  public async getFromBlocks(): Promise<Map<Address, bigint>> {
    const fromBlocks = new Map<Address, bigint>();
    const arrakisConfigs = this.configService.arrakisVaultConfigs;

    for (const config of arrakisConfigs) {
      const lastProcessedBlock = await this.progressMetadataDb.getLastBlockNumber(
        config.address,
        AggregationType.VAULT_COLLECTED_FEES_EVENT,
      );
      const fromBlock = lastProcessedBlock !== undefined ? lastProcessedBlock + 1n : BigInt(config.startingBlock);
      fromBlocks.set(config.address, fromBlock);
    }

    return fromBlocks;
  }
}
