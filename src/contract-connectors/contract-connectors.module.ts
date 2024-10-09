import { Logger, Module } from "@nestjs/common";
import { BlockchainConnectorsModule } from "../blockchain-connectors/blockchain-connectors.module";
import { ArrakisContractsService } from "./arrakis-contracts/arrakis-contracts.service";
import { PriceOraclesModule } from "../price-oracles/price-oracles.module";
import { DatabaseModule } from "../database/database.module";
import { WeweConfigModule } from "../config/wewe-data-aggregator-config.module";
import { FeeManagerContractsService } from "./fee-manager-contracts/fee-manager-contracts.service";

@Module({
  imports: [BlockchainConnectorsModule, WeweConfigModule, PriceOraclesModule, DatabaseModule],
  providers: [Logger, ArrakisContractsService, FeeManagerContractsService],
  exports: [ArrakisContractsService, FeeManagerContractsService],
})
export class ContractConnectorsModule {}
