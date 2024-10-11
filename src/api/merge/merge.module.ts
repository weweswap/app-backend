import { Module } from "@nestjs/common";
import { MergeService } from "./merge.service";
import { MergeController } from "./merge.controller";
import { DatabaseModule } from "../../database/database.module";
import { WeweConfigModule } from "../../config/wewe-data-aggregator-config.module";

@Module({
  imports: [DatabaseModule, WeweConfigModule],
  providers: [MergeService],
  controllers: [MergeController],
})
export class MergeModule {}
