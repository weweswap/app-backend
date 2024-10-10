import { formatUnits, getContract } from "viem";
import { Memoize, MemoizeExpiring } from "typescript-memoize";
import { VaultDbService } from "../../../database/vault-db/vault-db.service";
import {
  FIVE_MINUTES_IN_MILLISECONDS,
  LP_PRESENTATION_DECIMALS,
  MILLISECONDS_PER_WEEK,
  MILLISECONDS_PER_YEAR,
  USDC_DECIMALS,
} from "../../../shared/constants";
import { Token } from "../../../shared/types/common";
import {
  adjustPresentationDecimals,
  getEndOfPreviousDayTimestamp,
  getLastFullHourTimestamp,
  getStartDateFromNow,
} from "../../../utils/utils";
import { EvmConnectorService } from "../../../blockchain-connectors/evm-connector/evm-connector.service";
import { arrakisVaultAbi } from "../../../abis/abi";
import { ArrakisVaultConfig } from "../../../shared/class/WeweDataAggregatorConfig";
import { TimeFrame } from "../../../dto/HistoricDataQueryParamsDto";
import { HistoricTvlDatapoint } from "../../../dto/HistoricTvlDto";
import { RewardsConvertedToUsdcDbService } from "../../../database/rewards-usdc-db/rewards-usdc-db.service";
import { Erc20Service } from "../../../contract-connectors/erc-20/erc-20.service";

export class VaultsDataProvider {
  private readonly vaultConfig;
  public readonly vaultAddress;
  private readonly vaultContract;

  constructor(
    vaultConfig: ArrakisVaultConfig,
    private readonly archiveEvmConnector: EvmConnectorService,
    private readonly erc20Service: Erc20Service,
    private readonly dbService: VaultDbService,
    private readonly rewardsInUsdcDbService: RewardsConvertedToUsdcDbService,
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
   * Retrieves the sum of collected fees between two timestamps.
   * Results are cached and expire after five minutes to balance performance and data freshness.
   * @param startTimestamp The start timestamp for fee retrieval.
   * @param endTimestamp The end timestamp for fee retrieval.
   * @returns A promise that resolves to the VaultFees object representing the collected fees.
   */
  @MemoizeExpiring(FIVE_MINUTES_IN_MILLISECONDS)
  public async getRewardsConvertedToUsdc(startTimestamp: number, endTimestamp: number): Promise<bigint> {
    const rewardsInUsdc = await this.rewardsInUsdcDbService.getRewardsInUsdcSum(
      this.vaultAddress,
      startTimestamp,
      endTimestamp,
    );
    if (rewardsInUsdc) {
      return rewardsInUsdc;
    }
    return 0n;
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

  /**
   * Calculates the annualized fees based on the rewards in USDC in the specified timeframe.
   * @param startTimestamp The starting timestamp of the period.
   * @param endTimestamp The ending timestamp of the period.
   * @returns The total annualized fees in USD.
   */
  private async calculateAnnualizedFees(startTimestamp: number, endTimestamp: number): Promise<number> {
    const totalFeesInUsd = await this.getTotalFeesInUsd(startTimestamp, endTimestamp);
    const periodInYears = (endTimestamp - startTimestamp) / MILLISECONDS_PER_YEAR;

    if (periodInYears === 0) {
      return 0;
    }

    return totalFeesInUsd / periodInYears;
  }

  /**
   * Calculates the fee-based APR for the given LP data and price providers and tokens.
   * @returns A promise that resolves to the calculated APR as a number.
   */
  public async getFeeApr(): Promise<number> {
    const endTimestamp = getEndOfPreviousDayTimestamp();
    let startTimestamp = endTimestamp - MILLISECONDS_PER_WEEK; //weekly data

    // if vault is younger than 7 days, we use timestamp from startingBlock env property
    const deploymentTimestamp = await this.getDeploymentTimestamp();
    if (startTimestamp <= deploymentTimestamp) {
      startTimestamp = deploymentTimestamp;
    }

    const tvl = await this.getAverageTvl(startTimestamp, endTimestamp);
    const annualizedFees = await this.calculateAnnualizedFees(startTimestamp, endTimestamp);

    return (annualizedFees / tvl) * 100;
  }

  /**
   * Calculates the total accumulated fees in USD on this day.
   * @returns A promise that resolves to the accumulated fees in USDC.
   */
  public async getFeesPerDay(): Promise<number> {
    //get timestamps for start of the day until now
    let startTimestamp = getEndOfPreviousDayTimestamp();
    const endTimestamp = getLastFullHourTimestamp();

    // if vault deployment is after startTimestamp, we use timestamp from startingBlock env property
    const deploymentTimestamp = await this.getDeploymentTimestamp();
    if (startTimestamp <= deploymentTimestamp) {
      startTimestamp = deploymentTimestamp;
    }

    return await this.getTotalFeesInUsd(startTimestamp, endTimestamp);
  }

  private async getTotalFeesInUsd(startTimestamp: number, endTimestamp: number): Promise<number> {
    const collectedFees = await this.getRewardsConvertedToUsdc(startTimestamp, endTimestamp);

    return Number(formatUnits(collectedFees, USDC_DECIMALS));
  }
}
