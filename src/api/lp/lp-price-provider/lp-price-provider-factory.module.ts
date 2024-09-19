import { Logger, Module } from "@nestjs/common";
import { LpPriceProviderFactoryService } from "./lp-price-provider-factory.service";
import { HttpModule } from "@nestjs/axios";
import { BrokkrDataAggregatorConfigModule } from "../../../config/brokkr-data-aggregator-config.module";
import { DatabaseModule } from "../../../database/database.module";
import { PriceOraclesModule } from "../../../price-oracles/price-oracles.module";

@Module({
  imports: [
    BrokkrDataAggregatorConfigModule,
    DatabaseModule,
    PriceOraclesModule,
    HttpModule.register({
      timeout: 5000,
    }),
  ],
  providers: [LpPriceProviderFactoryService, Logger],
  exports: [LpPriceProviderFactoryService],
})
export class LpPriceProviderFactoryModule {}
