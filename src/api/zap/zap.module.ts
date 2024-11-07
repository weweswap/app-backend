import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";
import { ZapInController } from "./zap-in.controller";
import { ZapInService } from "./zap-in.service";
import { ContractConnectorsModule } from "../../contract-connectors/contract-connectors.module";
import { PriceOraclesModule } from "../../price-oracles/price-oracles.module";
import { ZapOutService } from "./zap-out.service";
import { BlockchainConnectorsModule } from "../../blockchain-connectors/blockchain-connectors.module";

@Module({
  imports: [
    HttpModule.register({
      timeout: 15000,
    }),
    WeweConfigModule,
    ContractConnectorsModule,
    PriceOraclesModule,
    BlockchainConnectorsModule,
  ],
  controllers: [ZapInController],
  providers: [ZapInService, ZapOutService],
  exports: [ZapInService, ZapOutService],
})
export class ZapModule {}
