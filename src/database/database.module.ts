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
import { PriceHistoricalDocument, PriceHistoricalDocumentSchema } from "./schemas/PriceHistoricalData.schema";
import { PriceDbService } from "./price-db/price-db.service";

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
      {
        name: PriceHistoricalDocument.name,
        schema: PriceHistoricalDocumentSchema,
      },
    ]),
    WeweConfigModule,
  ],
  providers: [Logger, VaultDbService, ProgressMetadataDbService, RewardsConvertedToUsdcDbService, PriceDbService],
  exports: [VaultDbService, ProgressMetadataDbService, RewardsConvertedToUsdcDbService, PriceDbService],
})
export class DatabaseModule {}
