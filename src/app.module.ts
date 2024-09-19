import { Logger, Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AggregatorsModule } from "./aggregators/aggregators.module";
import { BrokkrDataAggregatorConfigModule } from "./config/brokkr-data-aggregator-config.module";
import { ScheduleModule } from "@nestjs/schedule";
import { MongooseModule } from "@nestjs/mongoose";
import { BrokkrDataAggregatorConfigService } from "./config/brokkr-data-aggregator-config.service";
import { LpModule } from "./api/lp/lp.module";

@Module({
  imports: [
    BrokkrDataAggregatorConfigModule,
    AggregatorsModule,
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [BrokkrDataAggregatorConfigModule],
      useFactory: async (configService: BrokkrDataAggregatorConfigService) => ({
        uri: configService.config.mongoConfig.url,
        dbName: configService.config.mongoConfig.dbName,
      }),
      inject: [BrokkrDataAggregatorConfigService],
    }),
    LpModule,
  ],
  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule {}
