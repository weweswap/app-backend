import { Logger, Module } from "@nestjs/common";
import { BlockchainConnectorsModule } from "../blockchain-connectors/blockchain-connectors.module";
import { ArrakisContractsService } from "./arrakis-contracts/arrakis-contracts.service";
import { BrokkrDataAggregatorConfigModule } from "../config/brokkr-data-aggregator-config.module";
import { PriceOraclesModule } from "../price-oracles/price-oracles.module";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [BlockchainConnectorsModule, BrokkrDataAggregatorConfigModule, PriceOraclesModule, DatabaseModule],
  providers: [Logger, ArrakisContractsService],
  exports: [ArrakisContractsService],
})
export class ContractConnectorsModule {}
