import { Logger, Module } from "@nestjs/common";
import { AggregatorsService } from "./aggregators.service";
import { EventsAggregatorService } from "./events-aggregator/events-aggregator.service";
import { DatabaseModule } from "../database/database.module";
import { VaultAggregatorService } from "./vault-aggregator/vault-aggregator.service";
import { BlockchainConnectorsModule } from "../blockchain-connectors/blockchain-connectors.module";
import { ContractConnectorsModule } from "../contract-connectors/contract-connectors.module";
import { WeweConfigModule } from "../config/wewe-data-aggregator-config.module";
import { FeeManagerEventsHelperService } from "./events-aggregator/events-aggregator-helpers/fee-manager-events-helper.service";
import { PriceAggregatorService } from "./price-aggregator/price-aggregator.service";
import { PriceOraclesModule } from "../price-oracles/price-oracles.module";
import { LpOperationsHelperService } from "./events-aggregator/events-aggregator-helpers/lp-operations-helper.service";
import { MergeOperationsHelperService } from "./events-aggregator/events-aggregator-helpers/merge-operations-helper.service";
import { ChaosPointsHelperService } from "./events-aggregator/events-aggregator-helpers/chaos-points-helper.service";

@Module({
  imports: [WeweConfigModule, DatabaseModule, BlockchainConnectorsModule, ContractConnectorsModule, PriceOraclesModule],
  providers: [
    Logger,
    AggregatorsService,
    EventsAggregatorService,
    VaultAggregatorService,
    FeeManagerEventsHelperService,
    LpOperationsHelperService,
    PriceAggregatorService,
    MergeOperationsHelperService,
    ChaosPointsHelperService,
  ],
  exports: [AggregatorsService],
})
export class AggregatorsModule {}
