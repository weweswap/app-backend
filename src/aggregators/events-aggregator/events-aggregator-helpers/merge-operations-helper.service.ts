import { Injectable, Logger } from "@nestjs/common";
import { EvmConnectorService } from "../../../blockchain-connectors/evm-connector/evm-connector.service";
import { MergeContractMergedEvent, SingleLogEvent } from "../../../shared/models/Types";
import { Address, GetLogsReturnType } from "viem";
import { CoingeckoService } from "../../../price-oracles/coingecko/coingecko.service";
import { ProgressMetadataDbService } from "../../../database/progress-metadata/progress-metadata-db.service";
import { WeweConfigService } from "../../../config/wewe-data-aggregator-config.service";
import { TOKEN_DEFAULT_DB_PRECISION } from "../../../shared/constants";
import { AggregationType } from "../../../shared/enum/AggregationType";
import { MergeOperationsDbService } from "../../../database/merge-operations-db/merge-operations-db.service";
import { MergeContractsService } from "../../../contract-connectors/merge-contracts/merge-contracts.service";
import { MergeOperationDto, MergeOperationMetadataDto } from "../../../database/schemas/MergeOperation.schema";

@Injectable()
export class MergeOperationsHelperService {
  constructor(
    private readonly logger: Logger,
    private mergeOperationsDbService: MergeOperationsDbService,
    private progressMetadataDb: ProgressMetadataDbService,
    private evmConnector: EvmConnectorService,
    private mergeContractsService: MergeContractsService,
    private configService: WeweConfigService,
    private coingeckoService: CoingeckoService,
  ) {}

  public async handleMerge(log: GetLogsReturnType<typeof MergeContractMergedEvent>[number]) {
    const eventId = log.transactionHash + log.transactionIndex;
    const mergeContractAddress = log.address.toLowerCase() as Address;
    this.logger.debug(`Handling merge event for ${mergeContractAddress}`);

    const mergeCoinAmount = Number(log.args.amount ?? 0n);
    const weweAmount = Number(log.args.weweAmount ?? 0n);

    const timestamp = Number(await this.evmConnector.getBlockTimestamp(log.blockNumber));
    const mergeCoin = await this.mergeContractsService.getTokens(mergeContractAddress);

    const mergeCoinPrice = await this.coingeckoService.getTokenUsdPrice(
      this.configService.getMergeTokenCoingeckoId(mergeContractAddress),
      timestamp,
    );

    const usdcValue = (mergeCoinAmount * +mergeCoinPrice) / 10 ** +mergeCoin.decimals;

    const mergeOperation = new MergeOperationDto(
      eventId.toLowerCase(),
      new Date(timestamp),
      new MergeOperationMetadataDto(
        mergeContractAddress.toLowerCase(),
        log.args.account!.toLowerCase(),
        mergeCoinAmount.toString(),
        weweAmount.toString(),
        usdcValue.toFixed(TOKEN_DEFAULT_DB_PRECISION),
        Number(log.blockNumber),
      ),
    );

    // save merge operation
    await this.mergeOperationsDbService.saveMergeOperation(mergeOperation);
  }

  private async getLastBlockNumberForOperation(
    address: Address,
    aggregationType: AggregationType,
  ): Promise<bigint | undefined> {
    // try to find last blockNumber from progress metadata first
    const lastProgressBlockNumber = await this.progressMetadataDb.getLastBlockNumber(address, aggregationType);

    if (lastProgressBlockNumber) {
      return lastProgressBlockNumber;
    } else {
      // fallback to most recent operation
      return this.mergeOperationsDbService.getMostRecentOperationBlockNumber(address);
    }
  }

  public async checkIfEntryExists(log: SingleLogEvent) {
    const eventId = (log.transactionHash + log.logIndex).toLowerCase();
    const exists = await this.mergeOperationsDbService.checkIfEntryExists(eventId);
    return exists;
  }

  public async getFromBlocks(aggregationType: AggregationType): Promise<Map<Address, bigint>> {
    const fromBlocks = new Map<Address, bigint>();
    const mergeContractConfigs = this.configService.mergeContractConfigs;

    for (const config of mergeContractConfigs) {
      const fromBlock =
        (await this.getLastBlockNumberForOperation(config.mergeContractAddress, aggregationType)) ??
        BigInt(config.startingBlock);
      fromBlocks.set(config.mergeContractAddress, fromBlock);
    }

    return fromBlocks;
  }
}
