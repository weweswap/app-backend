import { Injectable, Logger } from "@nestjs/common";
import { LpPriceProvider } from "./lp-price-provider";
import { CoingeckoService } from "../../../price-oracles/coingecko/coingecko.service";
import { WeweConfigService } from "../../../config/wewe-data-aggregator-config.service";

@Injectable()
export class LpPriceProviderFactoryService {
  private lpPriceProviders: Map<string, LpPriceProvider>;

  constructor(
    private configService: WeweConfigService,
    private readonly logger: Logger,
    private coingeckoService: CoingeckoService,
  ) {
    this.lpPriceProviders = this.initLpPriceProviders();
  }

  initLpPriceProviders(): Map<string, LpPriceProvider> {
    const providersMap = new Map<string, LpPriceProvider>();

    const lpStrategies = this.configService.arrakisVaultConfigs;

    for (const lpStrategy of lpStrategies) {
      const address = lpStrategy.address;
      const provider = new LpPriceProvider(this.coingeckoService, lpStrategy);

      this.logger.debug(
        `Lp Price Provider initialized for ${lpStrategy.address} with Token0: ${lpStrategy.token0CoingeckoName} and Token1: ${lpStrategy.token1CoingeckoName}`,
        this.initLpPriceProviders.name,
      );
      providersMap.set(address, provider);
    }

    return providersMap;
  }

  getLpPriceProvider(lpAddress: string): LpPriceProvider | null {
    return this.lpPriceProviders.get(lpAddress) || null;
  }

  getAllLpPriceProviders(): LpPriceProvider[] {
    return Array.from(this.lpPriceProviders.values());
  }
}
