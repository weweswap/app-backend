import { Logger, Module } from "@nestjs/common";
import { AggregatorsService } from "./aggregators.service";
import { OperationsAggregatorService } from "./operations-aggregator/operations-aggregator.service";
import { DatabaseModule } from "../database/database.module";
import { VaultAggregatorService } from "./vault-aggregator/vault-aggregator.service";
import { BlockchainConnectorsModule } from "../blockchain-connectors/blockchain-connectors.module";
import { ArrakisOperationsHelperService } from "./operations-aggregator/operations-aggregator-helpers/arrakis-operations-helper.service";
import { ContractConnectorsModule } from "../contract-connectors/contract-connectors.module";
import { WeweConfigModule } from "../config/wewe-data-aggregator-config.module";
import { PriceAggregatorService } from "./price-aggregator/price-aggregator.service";
import { PriceOraclesModule } from "../price-oracles/price-oracles.module";

@Module({
  imports: [WeweConfigModule, DatabaseModule, BlockchainConnectorsModule, ContractConnectorsModule, PriceOraclesModule],
  providers: [
    Logger,
    AggregatorsService,
    OperationsAggregatorService,
    VaultAggregatorService,
    ArrakisOperationsHelperService,
    PriceAggregatorService,
  ],
  exports: [AggregatorsService],
})
export class AggregatorsModule {}
