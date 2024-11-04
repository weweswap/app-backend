import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { CoingeckoProxyService } from "./coingecko-proxy.service";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";

@Module({
  imports: [WeweConfigModule],
  providers: [CoingeckoProxyService],
})
export class CoingeckoProxyModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CoingeckoProxyService).forRoutes("/api/coingecko");
  }
}
