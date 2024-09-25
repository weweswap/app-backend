import { Logger, Module } from "@nestjs/common";
import { VaultsPriceProviderFactoryService } from "./vaults-price-provider-factory.service";
import { HttpModule } from "@nestjs/axios";
import { DatabaseModule } from "../../../database/database.module";
import { PriceOraclesModule } from "../../../price-oracles/price-oracles.module";
import { WeweConfigModule } from "../../../config/wewe-data-aggregator-config.module";

@Module({
  imports: [
    WeweConfigModule,
    DatabaseModule,
    PriceOraclesModule,
    HttpModule.register({
      timeout: 5000,
    }),
  ],
  providers: [VaultsPriceProviderFactoryService, Logger],
  exports: [VaultsPriceProviderFactoryService],
})
export class VaultsPriceProviderFactoryModule {}
