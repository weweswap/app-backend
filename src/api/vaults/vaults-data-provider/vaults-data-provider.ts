import { getContract } from "viem";
import { Memoize, MemoizeExpiring } from "typescript-memoize";
import { ArrakisHelperService } from "./arrakis-helper.service";
import { Logger } from "@nestjs/common";
import { Erc20Service } from "../../../blockchain-connectors/erc-20/erc-20.service";
import { VaultDbService } from "../../../database/vault-db/vault-db.service";
import { FIVE_MINUTES_IN_MILLISECONDS, LP_PRESENTATION_DECIMALS } from "../../../shared/constants";
import { Token, VaultFees } from "../../../shared/types/common";
import { adjustPresentationDecimals, getStartDateFromNow } from "../../../utils/utils";
import { EvmConnectorService } from "../../../blockchain-connectors/evm-connector/evm-connector.service";
import { arrakisVaultAbi } from "../../../abis/abi";
import { ArrakisVaultConfig } from "../../../shared/class/WeweDataAggregatorConfig";
import { TimeFrame } from "../../../dto/HistoricDataQueryParamsDto";
import { HistoricTvlDatapoint } from "../../../dto/HistoricTvlDto";

export class VaultsDataProvider {
  private readonly vaultConfig;
  public readonly vaultAddress;
  private readonly vaultContract;

  constructor(
    vaultConfig: ArrakisVaultConfig,
    private readonly archiveEvmConnector: EvmConnectorService,
    private readonly erc20Service: Erc20Service,
    private readonly arrakisHelperService: ArrakisHelperService,
    private readonly dbService: VaultDbService,
    private readonly logger: Logger,
  ) {
    this.vaultConfig = vaultConfig;
    this.vaultAddress = vaultConfig.address;
    this.vaultContract = getContract({
      address: this.vaultAddress,
      abi: arrakisVaultAbi,
      client: this.archiveEvmConnector.client,
    });
  }

  @Memoize()
  public async getChain(): Promise<string> {
    return await this.archiveEvmConnector.getNetwork();
  }

  @Memoize()
  public async getToken0(): Promise<Token> {
    const token0Address = await this.vaultContract.read.token0();
    const chain = await this.getChain();
    const token0 = await this.erc20Service.getErc20Token(token0Address, chain);

    return adjustPresentationDecimals(token0, LP_PRESENTATION_DECIMALS);
  }

  @Memoize()
  public async getToken1(): Promise<Token> {
    const token1Address = await this.vaultContract.read.token1();
    const chain = await this.getChain();
    const token1 = await this.erc20Service.getErc20Token(token1Address, chain);

    return adjustPresentationDecimals(token1, LP_PRESENTATION_DECIMALS);
  }

  /**
   * Calculates the difference in uncollected fees between two timestamps.
   * Results are cached and expire after five minutes to balance performance and data freshness.
   * @param startTimestamp The start timestamp for fee calculation.
   * @param endTimestamp The end timestamp for fee calculation.
   * @returns A promise that resolves to the VaultFees object representing the fee differences.
   */
  @Memoize({
    expiring: FIVE_MINUTES_IN_MILLISECONDS,
    hashFunction: (startTimestamp: number, endTimestamp: number) => {
      return startTimestamp.toString() + ";" + endTimestamp.toString();
    },
  })
  public async getUncollectedFeesDifference(startTimestamp: number, endTimestamp: number): Promise<VaultFees> {
    let startFees: VaultFees;
    let endFees: VaultFees;

    const startBlockNumber = await this.archiveEvmConnector.getClosestBlocknumber(startTimestamp);
    const endBlockNumber = await this.archiveEvmConnector.getClosestBlocknumber(endTimestamp);

    try {
      const tokenHoldings = await this.arrakisHelperService.getAllUnderlyingTokenHoldings(
        this.vaultAddress,
        startBlockNumber,
      );
      startFees = { fee0: tokenHoldings.fee0, fee1: tokenHoldings.fee1 };
    } catch (e) {
      this.logger.error(
        `Error fetching startFees fees for address=${this.vaultAddress},timestamp ${startTimestamp}:`,
        e,
      );
      startFees = { fee0: 0n, fee1: 0n };
    }

    try {
      const tokenHoldings = await this.arrakisHelperService.getAllUnderlyingTokenHoldings(
        this.vaultAddress,
        endBlockNumber,
      );
      endFees = { fee0: tokenHoldings.fee0, fee1: tokenHoldings.fee1 };
    } catch (e) {
      this.logger.error(`Error fetching endFees fees for address=${this.vaultAddress},timestamp ${endTimestamp}:`, e);
      endFees = { fee0: 0n, fee1: 0n };
    }

    const fee0Diff = endFees.fee0 - startFees.fee0;
    const fee1Diff = endFees.fee1 - startFees.fee1;

    return { fee0: fee0Diff, fee1: fee1Diff };
  }

  /**
   * Retrieves the sum of collected fees between two timestamps.
   * Results are cached and expire after five minutes to balance performance and data freshness.
   * @param startTimestamp The start timestamp for fee retrieval.
   * @param endTimestamp The end timestamp for fee retrieval.
   * @returns A promise that resolves to the VaultFees object representing the collected fees.
   */
  @MemoizeExpiring(FIVE_MINUTES_IN_MILLISECONDS)
  public async getCollectedFees(startTimestamp: number, endTimestamp: number): Promise<VaultFees> {
    const collectedFees = await this.dbService.getCollectedFeeSum(this.vaultAddress, startTimestamp, endTimestamp);
    if (collectedFees) {
      return collectedFees;
    }
    return { fee0: 0n, fee1: 0n };
  }

  /**
   * Retrieves the average Total Value Locked (TVL) between two timestamps.
   * Results are cached and expire after five minutes to balance performance and data freshness.
   * @param startTimestamp The start timestamp for TVL calculation.
   * @param endTimestamp The end timestamp for TVL calculation.
   * @returns A promise that resolves to the average TVL as a number.
   */
  @MemoizeExpiring(FIVE_MINUTES_IN_MILLISECONDS)
  public async getAverageTvl(startTimestamp: number, endTimestamp: number): Promise<number> {
    return await this.dbService.getAverageTvl(this.vaultAddress, startTimestamp, endTimestamp);
  }

  @Memoize()
  public async getDeploymentTimestamp(): Promise<number> {
    return Number(await this.archiveEvmConnector.getBlockTimestamp(BigInt(this.vaultConfig.startingBlock)));
  }

  public async getHistoricTvl(timeframe: TimeFrame): Promise<HistoricTvlDatapoint[]> {
    const startDate = getStartDateFromNow(timeframe);
    const tvlPoints = await this.dbService.getTvlPointsOfVaultToken(this.vaultAddress, startDate);

    return tvlPoints;
  }

  public async getHistoricPrice(timeframe: TimeFrame) {
    const startDate = getStartDateFromNow(timeframe);
    const pricePoints = await this.dbService.getPricePointsOfToken0(this.vaultAddress, startDate);

    return pricePoints;
  }
}
