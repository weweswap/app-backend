import { Injectable, Logger } from "@nestjs/common";
import { EvmConnectorService } from "../../../blockchain-connectors/evm-connector/evm-connector.service";
import { ArrakisContractsService } from "../../../contract-connectors/arrakis-contracts/arrakis-contracts.service";
import { LpVaultLogBurnAbiEvent, LpVaultLogMintAbiEvent, SingleLogEvent } from "../../../shared/models/Types";
import { Address, GetLogsReturnType } from "viem";
import { CoingeckoService } from "../../../price-oracles/coingecko/coingecko.service";
import { ProgressMetadataDbService } from "../../../database/progress-metadata/progress-metadata-db.service";
import { LpOperationsDbService } from "../../../database/lp-operations-db/lp-operations-db.service";
import { WeweConfigService } from "../../../config/wewe-data-aggregator-config.service";
import { Erc20Service } from "../../../contract-connectors/erc-20/erc-20.service";
import { OperationType } from "../../../shared/enum/OperationType";
import { LpOperationDto, LpOperationMetadataDto } from "../../../database/schemas/LpOperation.schema";
import { TOKEN_DEFAULT_DB_PRECISION } from "../../../shared/constants";
import { AggregationType } from "../../../shared/enum/AggregationType";
import { LpPositionDbService } from "../../../database/lp-positions-db/lp-positions-db.service";
import { ChaosPointsHelperService } from "../../../database/user-db/chaos-points-helper.service";

@Injectable()
export class LpOperationsHelperService {
  constructor(
    private readonly logger: Logger,
    private lpOperationsDbService: LpOperationsDbService,
    private progressMetadataDb: ProgressMetadataDbService,
    private evmConnector: EvmConnectorService,
    private configService: WeweConfigService,
    private arrakisVaultContractService: ArrakisContractsService,
    private coingeckoService: CoingeckoService,
    private erc20Service: Erc20Service,
    private lpPositionDbService: LpPositionDbService,
    private chaosPointsHelperService: ChaosPointsHelperService,
  ) {}

  /**
   * Handles LP vault Deposit Events
   * @param log Deposit event log
   */
  public async handleDeposit(log: GetLogsReturnType<typeof LpVaultLogMintAbiEvent>[number]) {
    const operationType = OperationType.Deposit;

    const eventId = log.transactionHash + log.logIndex;
    const vaultAddress = log.address.toLowerCase() as Address;
    this.logger.debug(`Handling lp operation event (${vaultAddress}) of type "deposit"`);

    const amount0In = log.args.amount0In ?? 0n;
    const amount1In = log.args.amount1In ?? 0n;
    const shareAmount = log.args.mintAmount ?? 0n;

    const timestamp = Number(await this.evmConnector.getBlockTimestamp(log.blockNumber));
    const { token0, token1 } = await this.arrakisVaultContractService.getTokens(vaultAddress);

    const [t0Price, t1Price, t0Decimals, t1Decimals] = await Promise.all([
      this.coingeckoService.getTokenUsdPrice(
        this.configService.getArrakisVaultToken0CoingeckoId(vaultAddress),
        timestamp,
      ),
      this.coingeckoService.getTokenUsdPrice(
        this.configService.getArrakisVaultToken1CoingeckoId(vaultAddress),
        timestamp,
      ),
      this.erc20Service.getErc20TokenDecimals(token0.address),
      this.erc20Service.getErc20TokenDecimals(token1.address),
    ]);

    const usdcValue =
      (Number(amount0In) * +t0Price) / 10 ** t0Decimals + (Number(amount1In) * +t1Price) / 10 ** t1Decimals;

    const depositOperation = new LpOperationDto(
      eventId.toLowerCase(),
      new Date(timestamp),
      new LpOperationMetadataDto(
        vaultAddress.toLowerCase(),
        log.args.receiver!.toLowerCase(),
        amount0In.toString(),
        amount1In.toString(),
        shareAmount.toString(),
        usdcValue.toFixed(TOKEN_DEFAULT_DB_PRECISION),
        Number(log.blockNumber),
        operationType,
      ),
    );

    // save lp operation
    await this.lpOperationsDbService.saveArrakisVaultOperation(depositOperation);

    // Record LP Position
    await this.lpPositionDbService.createLPPosition({
      userAddress: log.args.receiver!.toLowerCase(),
      vaultAddress: vaultAddress.toLowerCase(),
      shareAmount: shareAmount.toString(),
      usdcValue: usdcValue,
      lastRewardTimestamp: new Date(timestamp),
      depositTimestamp: new Date(timestamp),
      depositId: eventId.toLowerCase(),
    });

    this.logger.debug(`Recorded LP position for user ${log.args.receiver!.toLowerCase()} at ${new Date(timestamp)}`);
  }

  /**
   * Handles LP vault Withdrawal Events
   * @param log Withdrawal event log
   */
  public async handleWithdrawal(log: GetLogsReturnType<typeof LpVaultLogBurnAbiEvent>[number]) {
    const operationType = OperationType.Withdrawal;

    const eventId = log.transactionHash + log.logIndex;
    const vaultAddress = log.address.toLowerCase() as Address;
    this.logger.debug(`Handling lp operation event (${vaultAddress}) of type "withdraw"`);

    const amount0Out = log.args.amount0Out ?? 0n;
    const amount1Out = log.args.amount1Out ?? 0n;
    const shareAmount = log.args.burnAmount ?? 0n;

    const timestamp = Number(await this.evmConnector.getBlockTimestamp(log.blockNumber));
    const { token0, token1 } = await this.arrakisVaultContractService.getTokens(vaultAddress);

    const [t0Price, t1Price, t0Decimals, t1Decimals] = await Promise.all([
      this.coingeckoService.getTokenUsdPrice(
        this.configService.getArrakisVaultToken0CoingeckoId(vaultAddress),
        timestamp,
      ),
      this.coingeckoService.getTokenUsdPrice(
        this.configService.getArrakisVaultToken1CoingeckoId(vaultAddress),
        timestamp,
      ),
      this.erc20Service.getErc20TokenDecimals(token0.address),
      this.erc20Service.getErc20TokenDecimals(token1.address),
    ]);

    const usdcValue =
      (Number(amount0Out) * +t0Price) / 10 ** t0Decimals + (Number(amount1Out) * +t1Price) / 10 ** t1Decimals;

    const withdrawalOperation = new LpOperationDto(
      eventId.toLowerCase(),
      new Date(timestamp),
      new LpOperationMetadataDto(
        vaultAddress.toLowerCase(),
        log.args.receiver!.toLowerCase(),
        amount0Out.toString(),
        amount1Out.toString(),
        shareAmount.toString(),
        usdcValue.toFixed(TOKEN_DEFAULT_DB_PRECISION),
        Number(log.blockNumber),
        operationType,
      ),
    );

    // Save withdrawal operation
    await this.lpOperationsDbService.saveArrakisVaultOperation(withdrawalOperation);

    // Retrieve active LP positions for the user and vault
    const userAddress = log.args.receiver!.toLowerCase();
    const vaultAddr = vaultAddress.toLowerCase();

    const activeLPPositions = await this.lpPositionDbService.findActiveLPPositions(userAddress, vaultAddr);

    if (activeLPPositions.length === 0) {
      this.logger.warn(`No active LP positions found for user ${userAddress} in vault ${vaultAddr} during withdrawal.`);
      return;
    }

    // Assuming FIFO: Withdraw from the earliest deposit first
    let remainingShares = shareAmount;

    for (const position of activeLPPositions) {
      if (remainingShares <= 0n) break;

      const transferableShares = this.minBigInt(BigInt(position.shareAmount), remainingShares);
      const withdrawTime = new Date(timestamp);

      // Award historic CHAOS points before consolidating
      await this.chaosPointsHelperService.calculateAndAwardHistoricChaosPoints(position, withdrawTime);

      // Update or remove the LP position without awarding CHAOS points
      if (transferableShares >= BigInt(position.shareAmount)) {
        // Entire position is withdrawn
        await this.lpPositionDbService.deleteLPPosition(position.depositId);
      } else {
        const newShares = BigInt(position.shareAmount) - transferableShares;
        const newUsdcValue = (Number(newShares) * usdcValue) / Number(shareAmount);
        // Partial withdrawal, update the remaining USDC value
        await this.lpPositionDbService.updateLPPositionShares(position.depositId, newShares, Number(newUsdcValue));
      }

      remainingShares -= transferableShares;
    }

    if (remainingShares > 0n) {
      this.logger.warn(
        `Withdrawal shares (${shareAmount}) exceeds active LP positions for user ${userAddress} in vault ${vaultAddr}. Remaining: ${remainingShares}`,
      );
    }
  }

  /**
   * Retrieves the last block number for a given operation.
   * @param address Vault address.
   * @param aggregationType Type of aggregation.
   * @param operationType Type of operation.
   */
  private async getLastBlockNumberForOperation(
    address: Address,
    aggregationType: AggregationType,
    operationType: OperationType,
  ): Promise<bigint | undefined> {
    // try to find last blockNumber from progress metadata first
    const lastProgressBlockNumber = await this.progressMetadataDb.getLastBlockNumber(address, aggregationType);

    if (lastProgressBlockNumber) {
      return lastProgressBlockNumber;
    } else {
      // fallback to most recent operation
      return this.lpOperationsDbService.getMostRecentOperationBlockNumber(address, operationType);
    }
  }

  /**
   * Checks if an LP operation entry exists.
   * @param log Log event.
   */
  public async checkIfEntryExists(log: SingleLogEvent) {
    const eventId = (log.transactionHash + log.logIndex).toLowerCase();
    const exists = await this.lpOperationsDbService.checkIfEntryExists(eventId);
    return exists;
  }

  /**
   * Retrieves the from blocks for aggregation.
   * @param aggregationType Type of aggregation.
   */
  public async getFromBlocks(aggregationType: AggregationType): Promise<Map<Address, bigint>> {
    const fromBlocks = new Map<Address, bigint>();
    const arrakisConfigs = this.configService.arrakisVaultConfigs;
    let operationType: OperationType;

    if (aggregationType === AggregationType.LP_DEPOSIT) {
      operationType = OperationType.Deposit;
    } else {
      operationType = OperationType.Withdrawal;
    }

    for (const config of arrakisConfigs) {
      const fromBlock =
        (await this.getLastBlockNumberForOperation(config.address, aggregationType, operationType)) ??
        BigInt(config.startingBlock);
      fromBlocks.set(config.address, fromBlock);
    }

    return fromBlocks;
  }

  public minBigInt(...values: bigint[]) {
    if (values.length === 0) {
      throw new Error("No values provided");
    }
    return values.reduce((min, val) => (val < min ? val : min));
  }
}
