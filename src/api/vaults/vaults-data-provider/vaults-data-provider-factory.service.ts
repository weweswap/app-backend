import { Injectable, Logger } from "@nestjs/common";
import { VaultsDataProvider } from "./vaults-data-provider";
import { EvmConnectorService } from "../../../blockchain-connectors/evm-connector/evm-connector.service";
import { VaultDbService } from "../../../database/vault-db/vault-db.service";
import { WeweConfigService } from "../../../config/wewe-data-aggregator-config.service";
import { RewardsConvertedToUsdcDbService } from "../../../database/rewards-usdc-db/rewards-usdc-db.service";
import { Erc20Service } from "../../../contract-connectors/erc-20/erc-20.service";

@Injectable()
export class VaultsDataProviderFactoryService {
  private vaultsDataProviders: Map<string, VaultsDataProvider>;

  constructor(
    private configService: WeweConfigService,
    private readonly logger: Logger,
    private readonly archiveEvmConnector: EvmConnectorService,
    private readonly erc20Service: Erc20Service,
    private readonly dbService: VaultDbService,
    private readonly rewardsInUsdcDbService: RewardsConvertedToUsdcDbService,
  ) {
    this.vaultsDataProviders = this.initLpDataProviders();
  }

  initLpDataProviders(): Map<string, VaultsDataProvider> {
    const providersMap = new Map<string, VaultsDataProvider>();

    const vaults = this.configService.arrakisVaultConfigs;

    for (const vault of vaults) {
      const address = vault.address;
      const provider = new VaultsDataProvider(
        vault,
        this.archiveEvmConnector,
        this.erc20Service,
        this.dbService,
        this.rewardsInUsdcDbService,
      );

      this.logger.debug(
        `Vaults Data Provider initialized for ${vault.address} with Token0: ${vault.token0CoingeckoName} and Token1: ${vault.token1CoingeckoName}`,
        this.initLpDataProviders.name,
      );
      providersMap.set(address, provider);
    }

    return providersMap;
  }

  getLpDataProvider(lpAddress: string): VaultsDataProvider | null {
    return this.vaultsDataProviders.get(lpAddress) || null;
  }

  getAllLpDataProviders(): VaultsDataProvider[] {
    return Array.from(this.vaultsDataProviders.values());
  }
}
