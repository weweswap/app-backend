import { Module } from "@nestjs/common";
import { MergeService } from "./merge.service";
import { MergeController } from "./merge.controller";
import { DatabaseModule } from "../../database/database.module";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";
import { WhitelistService } from "./whitelist.service";
import { ContractConnectorsModule } from "../../contract-connectors/contract-connectors.module";

@Module({
  imports: [DatabaseModule, WeweConfigModule, ContractConnectorsModule],
  providers: [MergeService, WhitelistService],
  controllers: [MergeController],
})
export class MergeModule {}
