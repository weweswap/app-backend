import { Logger, Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AggregatorsModule } from "./aggregators/aggregators.module";
import { ScheduleModule } from "@nestjs/schedule";
import { MongooseModule } from "@nestjs/mongoose";
import { VaultsModule } from "./api/vaults/vaults.module";
import { WeweConfigModule } from "./config/wewe-data-aggregator-config.module";
import { WeweConfigService } from "./config/wewe-data-aggregator-config.service";
import { MergeModule } from "./api/merge/merge.module";
import { AxiosRetryModule } from "nestjs-axios-retry";
import axiosRetry from "axios-retry";
import { CoingeckoProxyModule } from "./api/coingecko-proxy/coingecko-proxy.module";
import { ZapModule } from "./api/zap/zap.module";
import { ChaosModule } from "./api/chaos/chaos.module";

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
    AxiosRetryModule.forRoot({
      axiosRetryConfig: {
        retries: 5,
        retryDelay: axiosRetry.exponentialDelay,
        shouldResetTimeout: true,
        retryCondition: (error) => {
          return axiosRetry.isNetworkOrIdempotentRequestError(error);
        },
      },
    }),
    VaultsModule,
    MergeModule,
    ZapModule,
    CoingeckoProxyModule,
    ChaosModule,
  ],
  controllers: [AppController],
  providers: [AppService, Logger],
})
export class AppModule {}
