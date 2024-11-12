import { MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { MergeService } from "./merge.service";
import { MergeController } from "./merge.controller";
import { DatabaseModule } from "../../database/database.module";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";
import { WhitelistService } from "./whitelist.service";
import { ContractConnectorsModule } from "../../contract-connectors/contract-connectors.module";
import { ImportService } from "./importWhitelist.service";
import { ApiKeyMiddleware } from "../../auth/auth.middleware";

@Module({
  imports: [DatabaseModule, WeweConfigModule, ContractConnectorsModule],
  providers: [MergeService, WhitelistService, ImportService],
  controllers: [MergeController],
})
export class MergeModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ApiKeyMiddleware).forRoutes({ path: "api/merge/whitelist/csv", method: RequestMethod.POST });
  }
}
