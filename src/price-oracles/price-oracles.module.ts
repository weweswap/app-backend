import { Logger, Module } from "@nestjs/common";
import { CoingeckoService } from "./coingecko/coingecko.service";
import { BrokkrDataAggregatorConfigModule } from "../config/brokkr-data-aggregator-config.module";
import { HttpModule } from "@nestjs/axios";

@Module({
  imports: [BrokkrDataAggregatorConfigModule, HttpModule],
  providers: [CoingeckoService, Logger],
  exports: [CoingeckoService],
})
export class PriceOraclesModule {}
