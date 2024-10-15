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

@Module({
  imports: [WeweConfigModule, DatabaseModule, BlockchainConnectorsModule, ContractConnectorsModule, PriceOraclesModule],
  providers: [
    Logger,
    AggregatorsService,
    EventsAggregatorService,
    VaultAggregatorService,
    FeeManagerEventsHelperService,
    PriceAggregatorService,
  ],
  exports: [AggregatorsService],
})
export class AggregatorsModule {}
