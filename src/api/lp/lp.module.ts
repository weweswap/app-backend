import { Logger, Module } from "@nestjs/common";
import { LpService } from "./lp.service";
import { LpController } from "./lp.controller";
import { LpPriceProviderFactoryModule } from "./lp-price-provider/lp-price-provider-factory.module";
import { LpDataProviderFactoryModule } from "./lp-data-provider/lp-data-provider-factory.module";
import { HttpModule } from "@nestjs/axios";
import { BrokkrDataAggregatorConfigModule } from "../../config/brokkr-data-aggregator-config.module";
import { DatabaseModule } from "../../database/database.module";
import { BlockchainConnectorsModule } from "../../blockchain-connectors/blockchain-connectors.module";

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
    }),
    LpPriceProviderFactoryModule,
    LpDataProviderFactoryModule,
    BlockchainConnectorsModule,
    DatabaseModule,
    BrokkrDataAggregatorConfigModule,
  ],
  controllers: [LpController],
  providers: [LpService, Logger],
  exports: [LpService],
})
export class LpModule {}
