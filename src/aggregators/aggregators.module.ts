import { Logger, Module } from "@nestjs/common";
import { AggregatorsService } from "./aggregators.service";
import { OperationsAggregatorService } from "./operations-aggregator/operations-aggregator.service";
import { BrokkrDataAggregatorConfigModule } from "../config/brokkr-data-aggregator-config.module";
import { DatabaseModule } from "../database/database.module";
import { VaultAggregatorService } from "./vault-aggregator/vault-aggregator.service";
import { BlockchainConnectorsModule } from "../blockchain-connectors/blockchain-connectors.module";
import { ArrakisOperationsHelperService } from "./operations-aggregator/operations-aggregator-helpers/arrakis-operations-helper.service";
import { ContractConnectorsModule } from "../contract-connectors/contract-connectors.module";

@Module({
  imports: [BrokkrDataAggregatorConfigModule, DatabaseModule, BlockchainConnectorsModule, ContractConnectorsModule],
  providers: [
    Logger,
    AggregatorsService,
    OperationsAggregatorService,
    VaultAggregatorService,
    ArrakisOperationsHelperService,
  ],
  exports: [AggregatorsService],
})
export class AggregatorsModule {}
