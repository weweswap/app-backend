import { Logger, Injectable } from "@nestjs/common";
import { VaultsDataProviderFactoryService } from "./vaults-data-provider/vaults-data-provider-factory.service";
import { Address } from "viem";
import { VaultsDataProvider } from "./vaults-data-provider/vaults-data-provider";
import { VaultInfoResponseDto } from "../../dto/VaultInfoResponseDto";
import { HistoricTvlDatapoint } from "../../dto/HistoricTvlDto";
import { HistoricPriceDatapoint } from "../../dto/HistoricPriceDto";
import { TimeFrame } from "../../dto/HistoricDataQueryParamsDto";
import { FeeManagerContractsService } from "../../contract-connectors/fee-manager-contracts/fee-manager-contracts.service";
import { WeweConfigService } from "../../config/wewe-data-aggregator-config.service";

@Injectable()
export class VaultsService {
  private readonly logger = new Logger(VaultsService.name);

  constructor(
    private lpDataProviderFactoryService: VaultsDataProviderFactoryService,
    private feeManagerContractService: FeeManagerContractsService,
    private configService: WeweConfigService,
  ) {}

  /**
   * Retrieves the Annual Percentage Rate (APR) for a given vault address.
   * @param vaultAddress The address of the vault for which APR is to be calculated.
   * @returns A promise that resolves to an LpResponseDto containing the vault address and its APR.
   */
  public async getVaultInfo(vaultAddress: Address): Promise<VaultInfoResponseDto> {
    this.logger.debug(this.getVaultInfo.name, vaultAddress);
    const vaultDataProvider = this.getDataProvider(vaultAddress);
    const feeManagerAddress = this.configService.getfeeManagerAddress(vaultAddress);

    try {
      const [apr, feesPerDay, rate] = await Promise.all([
        vaultDataProvider.getFeeApr(),
        vaultDataProvider.getFeesPerDay(),
        this.feeManagerContractService.getRate(feeManagerAddress),
      ]);
      const incentivesPerDay = feesPerDay * rate;

      return new VaultInfoResponseDto(vaultAddress, apr, feesPerDay, incentivesPerDay);
    } catch (error) {
      this.logger.error("Error retrieving vault info:", error);
      throw error;
    }
  }

  public async getHistoricTvl(vaultAddress: Address, timeframe: TimeFrame): Promise<HistoricTvlDatapoint[]> {
    this.logger.debug(this.getHistoricTvl.name, vaultAddress);
    const vaultDataProvider = this.getDataProvider(vaultAddress);

    return await vaultDataProvider.getHistoricTvl(timeframe);
  }

  public async getHistoricPrice(vaultAddress: Address, timeframe: TimeFrame): Promise<HistoricPriceDatapoint[]> {
    this.logger.debug(this.getHistoricPrice.name, vaultAddress);
    const vaultDataProvider = this.getDataProvider(vaultAddress);

    return await vaultDataProvider.getHistoricPrice(timeframe);
  }

  private getDataProvider(address: string): VaultsDataProvider {
    const dataProvider = this.lpDataProviderFactoryService.getLpDataProvider(address);

    if (!dataProvider) {
      throw new Error(`Provider for vault address ${address} not found.`);
    }

    return dataProvider;
  }
}
