import { Logger, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import configuration from "./configuration";
import { WeweConfigService } from "./wewe-data-aggregator-config.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [configuration],
    }),
  ],
  providers: [WeweConfigService, Logger],
  exports: [WeweConfigService],
})
export class WeweConfigModule {}
