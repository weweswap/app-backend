import { Logger, Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AggregatorsModule } from "./aggregators/aggregators.module";
import { ScheduleModule } from "@nestjs/schedule";
import { MongooseModule } from "@nestjs/mongoose";
import { VaultsModule } from "./api/vaults/vaults.module";
import { WeweConfigModule } from "./config/wewe-data-aggregator-config.module";
import { WeweConfigService } from "./config/wewe-data-aggregator-config.service";

@Module({
  imports: [
    WeweConfigModule,
    AggregatorsModule,
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [WeweConfigModule],
      useFactory: async (configService: WeweConfigService) => ({
        uri: configService.config.mongoConfig.url,
        dbName: configService.config.mongoConfig.dbName,
      }),
      inject: [WeweConfigService],
    }),
    VaultsModule,
  ],
  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule {}
