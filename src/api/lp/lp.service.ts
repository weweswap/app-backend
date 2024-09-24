import { Logger, Injectable } from "@nestjs/common";
import { LpDataProviderFactoryService } from "./lp-data-provider/lp-data-provider-factory.service";
import { LpPriceProviderFactoryService } from "./lp-price-provider/lp-price-provider-factory.service";
import { Address, formatUnits } from "viem";
import { getEndOfPreviousDayTimestamp } from "../../utils/utils";
import { LpDataProvider } from "./lp-data-provider/lp-data-provider";
import { LpPriceProvider } from "./lp-price-provider/lp-price-provider";
import { MILLISECONDS_PER_WEEK, MILLISECONDS_PER_YEAR } from "../../shared/constants";
import { Token, VaultFees } from "../../shared/types/common";
import { VaultInfoResponseDto } from "../../dto/VaultInfoResponseDto";

@Injectable()
export class LpService {
  private readonly logger = new Logger(LpService.name);

  constructor(
    private lpDataProviderFactoryService: LpDataProviderFactoryService,
    private lpPriceProviderFactoryService: LpPriceProviderFactoryService,
  ) {}

  /**
   * Retrieves the Annual Percentage Rate (APR) for a given vault address.
   * @param vaultAddress The address of the vault for which APR is to be calculated.
   * @returns A promise that resolves to an LpResponseDto containing the vault address and its APR.
   */
  public async getApr(vaultAddress: Address): Promise<VaultInfoResponseDto> {
    this.logger.debug(this.getApr.name, vaultAddress);

    const [lpPriceProvider, lpDataProvider] = this.getProviders(vaultAddress);

    const [token0, token1] = await Promise.all([lpDataProvider.getToken0(), lpDataProvider.getToken1()]);

    const apr = await this.getFeeApr(lpDataProvider, lpPriceProvider, token0, token1);

    return new VaultInfoResponseDto(vaultAddress, apr);
  }

  private getProviders(lpAddress: string): [LpPriceProvider, LpDataProvider] {
    const priceProvider = this.lpPriceProviderFactoryService.getLpPriceProvider(lpAddress);
    const dataProvider = this.lpDataProviderFactoryService.getLpDataProvider(lpAddress);

    if (!priceProvider || !dataProvider) {
      throw new Error(`Provider for lp management address ${lpAddress} not found.`);
    }

    return [priceProvider, dataProvider];
  }

  /**
   * Calculates the fee-based APR for the given LP data and price providers and tokens.
   * @param lpDataProvider The data provider for the Liquidity Pool.
   * @param lpPriceProvider The price provider for the Liquidity Pool.
   * @param token0 The first token in the Liquidity Pool.
   * @param token1 The second token in the Liquidity Pool.
   * @returns A promise that resolves to the calculated APR as a number.
   */
  private async getFeeApr(
    lpDataProvider: LpDataProvider,
    lpPriceProvider: LpPriceProvider,
    token0: Token,
    token1: Token,
  ) {
    const endTimestamp = getEndOfPreviousDayTimestamp();
    let startTimestamp = endTimestamp - MILLISECONDS_PER_WEEK; //weekly data

    // if vault is younger than 7 days, we use timestamp from startingBlock env property
    const deploymentTimestamp = await lpDataProvider.getDeploymentTimestamp();
    if (startTimestamp <= deploymentTimestamp) {
      startTimestamp = deploymentTimestamp;
    }

    const [token0UsdValue, token1UsdValue, uncollectedFeesDifference, collectedFees] = await Promise.all([
      lpPriceProvider.getToken0Price(),
      lpPriceProvider.getToken1Price(),
      lpDataProvider.getUncollectedFeesDifference(startTimestamp, endTimestamp),
      lpDataProvider.getCollectedFees(startTimestamp, endTimestamp),
    ]);

    const tvl = await lpDataProvider.getAverageTvl(startTimestamp, endTimestamp);

    const annualizedFees = this.calculateAnnualizedFees(
      uncollectedFeesDifference,
      collectedFees,
      token0,
      token1,
      +token0UsdValue,
      +token1UsdValue,
      endTimestamp - startTimestamp,
    );

    return (annualizedFees / tvl) * 100;
  }

  /**
   * Calculates the annualized fees based on collected and uncollected fees, token prices, and the period.
   * @param uncollectedFeesDifference The difference in uncollected fees over the period.
   * @param collectedFees The fees collected over the period.
   * @param token0 The first token in the Liquidity Pool.
   * @param token1 The second token in the Liquidity Pool.
   * @param token0UsdValue The USD value of the first token.
   * @param token1UsdValue The USD value of the second token.
   * @param periodInMillis The period over which fees are calculated, in milliseconds.
   * @returns The total annualized fees in USD.
   */
  private calculateAnnualizedFees(
    uncollectedFeesDifference: VaultFees,
    collectedFees: VaultFees,
    token0: Token,
    token1: Token,
    token0UsdValue: number,
    token1UsdValue: number,
    periodInMillis: number,
  ): number {
    const totalFee0 = collectedFees.fee0 + uncollectedFeesDifference.fee0;
    const totalFee1 = collectedFees.fee1 + uncollectedFeesDifference.fee1;

    const fee0InUsd = this.convertFeeToUsd(totalFee0, token0.decimals, token0UsdValue);
    const fee1InUsd = this.convertFeeToUsd(totalFee1, token1.decimals, token1UsdValue);
    const periodInYears = periodInMillis / MILLISECONDS_PER_YEAR;

    return (fee0InUsd + fee1InUsd) / periodInYears;
  }

  private convertFeeToUsd(fee: bigint, decimals: string, price: number): number {
    return Number(formatUnits(fee, Number(decimals))) * price;
  }
}
