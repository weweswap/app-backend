import { Injectable, Logger } from "@nestjs/common";
import { VaultsPriceProvider } from "./vaults-price-provider";
import { CoingeckoService } from "../../../price-oracles/coingecko/coingecko.service";
import { WeweConfigService } from "../../../config/wewe-data-aggregator-config.service";

@Injectable()
export class VaultsPriceProviderFactoryService {
  private vaultsPriceProviders: Map<string, VaultsPriceProvider>;

  constructor(
    private configService: WeweConfigService,
    private readonly logger: Logger,
    private coingeckoService: CoingeckoService,
  ) {
    this.vaultsPriceProviders = this.initLpPriceProviders();
  }

  initLpPriceProviders(): Map<string, VaultsPriceProvider> {
    const providersMap = new Map<string, VaultsPriceProvider>();

    const vaults = this.configService.arrakisVaultConfigs;

    for (const vault of vaults) {
      const address = vault.address;
      const provider = new VaultsPriceProvider(this.coingeckoService, vault);

      this.logger.debug(
        `Vaults Price Provider initialized for ${vault.address} with Token0: ${vault.token0CoingeckoName} and Token1: ${vault.token1CoingeckoName}`,
        this.initLpPriceProviders.name,
      );
      providersMap.set(address, provider);
    }

    return providersMap;
  }

  getLpPriceProvider(address: string): VaultsPriceProvider | null {
    return this.vaultsPriceProviders.get(address) || null;
  }

  getAllLpPriceProviders(): VaultsPriceProvider[] {
    return Array.from(this.vaultsPriceProviders.values());
  }
}
