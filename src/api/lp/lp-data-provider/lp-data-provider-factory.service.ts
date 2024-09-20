import { Injectable, Logger } from "@nestjs/common";
import { LpDataProvider } from "./lp-data-provider";
import { ArrakisHelperService } from "./arrakis-helper.service";
import { EvmConnectorService } from "../../../blockchain-connectors/evm-connector/evm-connector.service";
import { VaultDbService } from "../../../database/vault-db/vault-db.service";
import { Erc20Service } from "../../../blockchain-connectors/erc-20/erc-20.service";
import { WeweConfigService } from "../../../config/wewe-data-aggregator-config.service";

@Injectable()
export class LpDataProviderFactoryService {
  private lpDataProviders: Map<string, LpDataProvider>;

  constructor(
    private configService: WeweConfigService,
    private readonly logger: Logger,
    private readonly archiveEvmConnector: EvmConnectorService,
    private readonly erc20Service: Erc20Service,
    private readonly arrakisHelperService: ArrakisHelperService,
    private readonly dbService: VaultDbService,
  ) {
    this.lpDataProviders = this.initLpDataProviders();
  }

  initLpDataProviders(): Map<string, LpDataProvider> {
    const providersMap = new Map<string, LpDataProvider>();

    const lpStrategies = this.configService.arrakisVaultConfigs;

    for (const lpStrategy of lpStrategies) {
      const address = lpStrategy.address;
      const provider = new LpDataProvider(
        lpStrategy,
        this.archiveEvmConnector,
        this.erc20Service,
        this.arrakisHelperService,
        this.dbService,
        this.logger,
      );

      this.logger.debug(
        `Lp Data Provider initialized for ${lpStrategy.address} with Token0: ${lpStrategy.token0CoingeckoName} and Token1: ${lpStrategy.token1CoingeckoName}`,
        this.initLpDataProviders.name,
      );
      providersMap.set(address, provider);
    }

    return providersMap;
  }

  getLpDataProvider(lpAddress: string): LpDataProvider | null {
    return this.lpDataProviders.get(lpAddress) || null;
  }

  getAllLpDataProviders(): LpDataProvider[] {
    return Array.from(this.lpDataProviders.values());
  }
}
