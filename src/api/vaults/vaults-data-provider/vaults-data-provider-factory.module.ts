import { Logger, Module } from "@nestjs/common";
import { VaultsDataProviderFactoryService } from "./vaults-data-provider-factory.service";
import { ArrakisHelperService } from "./arrakis-helper.service";
import { HttpModule } from "@nestjs/axios";
import { DatabaseModule } from "../../../database/database.module";
import { BlockchainConnectorsModule } from "../../../blockchain-connectors/blockchain-connectors.module";
import { WeweConfigModule } from "../../../config/wewe-data-aggregator-config.module";

@Module({
  imports: [
    WeweConfigModule,
    BlockchainConnectorsModule,
    DatabaseModule,
    HttpModule.register({
      timeout: 5000,
    }),
  ],
  providers: [VaultsDataProviderFactoryService, Logger, ArrakisHelperService],
  exports: [VaultsDataProviderFactoryService, ArrakisHelperService],
})
export class VaultsDataProviderFactoryModule {}
