import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { MergeService } from "./merge.service";
import { MergeController } from "./merge.controller";
import { DatabaseModule } from "../../database/database.module";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";
import { WhitelistService } from "./whitelist.service";
import { ContractConnectorsModule } from "../../contract-connectors/contract-connectors.module";
import { ImportService } from "./importWhitelist.service";
import { ApiKeyMiddleware } from "../../auth/auth.middleware";
import { SnapshotService } from "./snapshot.service";
import { BlockchainConnectorsModule } from "../../blockchain-connectors/blockchain-connectors.module";

@Module({
  imports: [DatabaseModule, WeweConfigModule, ContractConnectorsModule, BlockchainConnectorsModule],
  providers: [MergeService, WhitelistService, ImportService, SnapshotService],
  controllers: [MergeController],
})
export class MergeModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ApiKeyMiddleware)
      .forRoutes(
        { path: "api/merge/whitelist/csv", method: RequestMethod.POST },
        { path: "api/merge/snapshot/:address", method: RequestMethod.POST },
        { path: "api/merge/merkleroot/:address", method: RequestMethod.POST },
      );
  }
}
