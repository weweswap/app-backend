import { Logger, Module } from "@nestjs/common";
import { VaultsDataProviderFactoryService } from "./vaults-data-provider-factory.service";
import { HttpModule } from "@nestjs/axios";
import { DatabaseModule } from "../../../database/database.module";
import { BlockchainConnectorsModule } from "../../../blockchain-connectors/blockchain-connectors.module";
import { WeweConfigModule } from "../../../config/wewe-data-aggregator-config.module";
import { ContractConnectorsModule } from "../../../contract-connectors/contract-connectors.module";

@Module({
  imports: [
    WeweConfigModule,
    BlockchainConnectorsModule,
    ContractConnectorsModule,
    DatabaseModule,
    HttpModule.register({
      timeout: 5000,
    }),
  ],
  providers: [VaultsDataProviderFactoryService, Logger],
  exports: [VaultsDataProviderFactoryService],
})
export class VaultsDataProviderFactoryModule {}
