import { Logger, Module } from "@nestjs/common";
import { AggregatorsService } from "./aggregators.service";
import { OperationsAggregatorService } from "./operations-aggregator/operations-aggregator.service";
import { DatabaseModule } from "../database/database.module";
import { VaultAggregatorService } from "./vault-aggregator/vault-aggregator.service";
import { BlockchainConnectorsModule } from "../blockchain-connectors/blockchain-connectors.module";
import { ArrakisOperationsHelperService } from "./operations-aggregator/operations-aggregator-helpers/arrakis-operations-helper.service";
import { ContractConnectorsModule } from "../contract-connectors/contract-connectors.module";
import { WeweConfigModule } from "../config/wewe-data-aggregator-config.module";

@Module({
  imports: [WeweConfigModule, DatabaseModule, BlockchainConnectorsModule, ContractConnectorsModule],
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
