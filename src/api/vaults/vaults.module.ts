import { Logger, Module } from "@nestjs/common";
import { VaultsService } from "./vaults.service";
import { VaultsController } from "./vaults.controller";
import { VaultsDataProviderFactoryModule } from "./vaults-data-provider/vaults-data-provider-factory.module";
import { HttpModule } from "@nestjs/axios";
import { DatabaseModule } from "../../database/database.module";
import { BlockchainConnectorsModule } from "../../blockchain-connectors/blockchain-connectors.module";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";
import { ContractConnectorsModule } from "../../contract-connectors/contract-connectors.module";

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
    }),
    VaultsDataProviderFactoryModule,
    BlockchainConnectorsModule,
    DatabaseModule,
    WeweConfigModule,
    ContractConnectorsModule,
  ],
  controllers: [VaultsController],
  providers: [VaultsService, Logger],
  exports: [VaultsService],
})
export class VaultsModule {}
