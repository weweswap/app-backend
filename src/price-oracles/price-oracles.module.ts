import { Logger, Module } from "@nestjs/common";
import { CoingeckoService } from "./coingecko/coingecko.service";
import { HttpModule } from "@nestjs/axios";
import { WeweConfigModule } from "../config/wewe-data-aggregator-config.module";

@Module({
  imports: [WeweConfigModule, HttpModule],
  providers: [CoingeckoService, Logger],
  exports: [CoingeckoService],
})
export class PriceOraclesModule {}
