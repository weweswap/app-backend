import { Logger, Injectable } from "@nestjs/common";
import { VaultsDataProviderFactoryService } from "./vaults-data-provider/vaults-data-provider-factory.service";
import { VaultsPriceProviderFactoryService } from "./vaults-price-provider/vaults-price-provider-factory.service";
import { Address, formatUnits } from "viem";
import { getEndOfPreviousDayTimestamp } from "../../utils/utils";
import { VaultsDataProvider } from "./vaults-data-provider/vaults-data-provider";
import { VaultsPriceProvider } from "./vaults-price-provider/vaults-price-provider";
import { MILLISECONDS_PER_WEEK, MILLISECONDS_PER_YEAR } from "../../shared/constants";
import { VaultInfoResponseDto } from "../../dto/VaultInfoResponseDto";
import { HistoricTvlDatapoint } from "../../dto/HistoricTvlDto";
import { HistoricPriceDatapoint } from "../../dto/HistoricPriceDto";
import { TimeFrame } from "../../dto/HistoricDataQueryParamsDto";

@Injectable()
export class VaultsService {
  private readonly logger = new Logger(VaultsService.name);

  constructor(
    private lpDataProviderFactoryService: VaultsDataProviderFactoryService,
    private lpPriceProviderFactoryService: VaultsPriceProviderFactoryService,
  ) {}

  /**
   * Retrieves the Annual Percentage Rate (APR) for a given vault address.
   * @param vaultAddress The address of the vault for which APR is to be calculated.
   * @returns A promise that resolves to an LpResponseDto containing the vault address and its APR.
   */
  public async getVaultInfo(vaultAddress: Address): Promise<VaultInfoResponseDto> {
    this.logger.debug(this.getVaultInfo.name, vaultAddress);

    const [apr, feesPerDay] = await Promise.all([this.getFeeApr(vaultAddress), this.getFeesPerDay(vaultAddress)]);

    return new VaultInfoResponseDto(vaultAddress, apr, feesPerDay);
  }

  public async getHistoricTvl(vaultAddress: Address, timeframe: TimeFrame): Promise<HistoricTvlDatapoint[]> {
    this.logger.debug(this.getHistoricTvl.name, vaultAddress);
    const [, vaultDataProvider] = this.getProviders(vaultAddress);

    return await vaultDataProvider.getHistoricTvl(timeframe);
  }

  public async getHistoricPrice(vaultAddress: Address, timeframe: TimeFrame): Promise<HistoricPriceDatapoint[]> {
    this.logger.debug(this.getHistoricPrice.name, vaultAddress);
    const [, vaultDataProvider] = this.getProviders(vaultAddress);

    return await vaultDataProvider.getHistoricPrice(timeframe);
  }

  private getProviders(address: string): [VaultsPriceProvider, VaultsDataProvider] {
    const priceProvider = this.lpPriceProviderFactoryService.getLpPriceProvider(address);
    const dataProvider = this.lpDataProviderFactoryService.getLpDataProvider(address);

    if (!priceProvider || !dataProvider) {
      throw new Error(`Provider for vault address ${address} not found.`);
    }

    return [priceProvider, dataProvider];
  }

  /**
   * Calculates the fee-based APR for the given LP data and price providers and tokens.
   * @param vaultDataProvider The data provider for the Vault.
   * @param vaultPriceProvider The price provider for the Vault.
   * @param token0 The first token in the Liquidity Pool.
   * @param token1 The second token in the Liquidity Pool.
   * @returns A promise that resolves to the calculated APR as a number.
   */
  private async getFeeApr(vaultAddress: Address): Promise<number> {
    const endTimestamp = getEndOfPreviousDayTimestamp();
    let startTimestamp = endTimestamp - MILLISECONDS_PER_WEEK; //weekly data

    const [, vaultDataProvider] = this.getProviders(vaultAddress);

    // if vault is younger than 7 days, we use timestamp from startingBlock env property
    const deploymentTimestamp = await vaultDataProvider.getDeploymentTimestamp();
    if (startTimestamp <= deploymentTimestamp) {
      startTimestamp = deploymentTimestamp;
    }

    const tvl = await vaultDataProvider.getAverageTvl(startTimestamp, endTimestamp);
    const annualizedFees = await this.calculateAnnualizedFees(vaultAddress, startTimestamp, endTimestamp);

    return (annualizedFees / tvl) * 100;
  }

  /**
   * Calculates the total accumulated fees in USD on this day.
   * @param vaultDataProvider The data provider for the Vault.
   * @param vaultPriceProvider The price provider for the Vault.
   * @param token0 The first token in the Liquidity Pool.
   * @param token1 The second token in the Liquidity Pool.
   * @returns A promise that resolves to the calculated APR as a number.
   */
  private async getFeesPerDay(vaultAddress: Address): Promise<number> {
    //get timestamps for start of the day until now
    let startTimestamp = getEndOfPreviousDayTimestamp();
    const endTimestamp = Date.now();

    const [, vaultDataProvider] = this.getProviders(vaultAddress);

    // if vault deployment is after startTimestamp, we use timestamp from startingBlock env property
    const deploymentTimestamp = await vaultDataProvider.getDeploymentTimestamp();
    if (startTimestamp <= deploymentTimestamp) {
      startTimestamp = deploymentTimestamp;
    }

    return await this.getTotalFeesInUsd(vaultAddress, startTimestamp, endTimestamp);
  }

  private async getTotalFeesInUsd(vaultAddress: Address, startTimestamp: number, endTimestamp: number) {
    const [vaultPriceProvider, vaultDataProvider] = this.getProviders(vaultAddress);

    const [token0, token1, token0UsdValue, token1UsdValue, uncollectedFeesDifference, collectedFees] =
      await Promise.all([
        vaultDataProvider.getToken0(),
        vaultDataProvider.getToken1(),
        vaultPriceProvider.getToken0Price(),
        vaultPriceProvider.getToken1Price(),
        vaultDataProvider.getUncollectedFeesDifference(startTimestamp, endTimestamp),
        vaultDataProvider.getCollectedFees(startTimestamp, endTimestamp),
      ]);

    const totalFee0 = collectedFees.fee0 + uncollectedFeesDifference.fee0;
    const totalFee1 = collectedFees.fee1 + uncollectedFeesDifference.fee1;

    const fee0InUsd = this.convertFeeToUsd(totalFee0, token0.decimals, +token0UsdValue);
    const fee1InUsd = this.convertFeeToUsd(totalFee1, token1.decimals, +token1UsdValue);

    return fee0InUsd + fee1InUsd;
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
  private async calculateAnnualizedFees(
    vaultAddress: Address,
    startTimestamp: number,
    endTimestamp: number,
  ): Promise<number> {
    const totalFeesInUsd = await this.getTotalFeesInUsd(vaultAddress, startTimestamp, endTimestamp);
    const periodInYears = (endTimestamp - startTimestamp) / MILLISECONDS_PER_YEAR;

    return totalFeesInUsd / periodInYears;
  }

  private convertFeeToUsd(fee: bigint, decimals: string, price: number): number {
    return Number(formatUnits(fee, Number(decimals))) * price;
  }
}
