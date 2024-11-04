import { Module } from "@nestjs/common";
import { MergeService } from "./merge.service";
import { MergeController } from "./merge.controller";
import { DatabaseModule } from "../../database/database.module";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";
import { WhitelistService } from "./whitelist.service";
import { ContractConnectorsModule } from "../../contract-connectors/contract-connectors.module";
import { MongooseModule } from "@nestjs/mongoose";
import { Whitelist, WhitelistSchema } from "../../database/schemas/WhitelistData.schema";

@Module({
  imports: [
    DatabaseModule,
    WeweConfigModule,
    ContractConnectorsModule,
    //TODO proper Db service
    MongooseModule.forFeature([{ name: Whitelist.name, schema: WhitelistSchema }]),
  ],
  providers: [MergeService, WhitelistService],
  controllers: [MergeController],
})
export class MergeModule {}
