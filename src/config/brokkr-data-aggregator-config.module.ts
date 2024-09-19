import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BrokkrDataAggregatorConfigService } from "./brokkr-data-aggregator-config.service";
import configuration from "./configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [configuration],
    }),
  ],
  providers: [BrokkrDataAggregatorConfigService, Logger],
  exports: [BrokkrDataAggregatorConfigService],
})
export class BrokkrDataAggregatorConfigModule {}
