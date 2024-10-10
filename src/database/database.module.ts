import { Logger, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { VaultDbService } from "./vault-db/vault-db.service";
import { VaultHistoricalDocument, VaultsHistoricalDocumentSchema } from "./schemas/VaultHistoricalData.schema";
import { WeweConfigModule } from "../config/wewe-data-aggregator-config.module";
import { ProgressMetadataDocument, ProgressMetadataSchema } from "./schemas/ProgressMetadata";
import { ProgressMetadataDbService } from "./progress-metadata/progress-metadata-db.service";
import {
  RewardsConvertedToUsdcEventDocument,
  RewardsConvertedToUsdcEventSchema,
} from "./schemas/RewardsConvertedToUsdcEvent.schema";
import { RewardsConvertedToUsdcDbService } from "./rewards-usdc-db/rewards-usdc-db.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: VaultHistoricalDocument.name,
        schema: VaultsHistoricalDocumentSchema,
      },
      {
        name: ProgressMetadataDocument.name,
        schema: ProgressMetadataSchema,
      },
      {
        name: RewardsConvertedToUsdcEventDocument.name,
        schema: RewardsConvertedToUsdcEventSchema,
      },
    ]),
    WeweConfigModule,
  ],
  providers: [Logger, VaultDbService, ProgressMetadataDbService, RewardsConvertedToUsdcDbService],
  exports: [VaultDbService, ProgressMetadataDbService, RewardsConvertedToUsdcDbService],
})
export class DatabaseModule {}
