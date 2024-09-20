import { Logger, Module } from "@nestjs/common";
import { LpService } from "./lp.service";
import { LpController } from "./lp.controller";
import { LpPriceProviderFactoryModule } from "./lp-price-provider/lp-price-provider-factory.module";
import { LpDataProviderFactoryModule } from "./lp-data-provider/lp-data-provider-factory.module";
import { HttpModule } from "@nestjs/axios";
import { DatabaseModule } from "../../database/database.module";
import { BlockchainConnectorsModule } from "../../blockchain-connectors/blockchain-connectors.module";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
    }),
    LpPriceProviderFactoryModule,
    LpDataProviderFactoryModule,
    BlockchainConnectorsModule,
    DatabaseModule,
    WeweConfigModule,
  ],
  controllers: [LpController],
  providers: [LpService, Logger],
  exports: [LpService],
})
export class LpModule {}
