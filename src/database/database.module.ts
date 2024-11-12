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
import { Whitelist, WhitelistSchema } from "./schemas/WhitelistData.schema";
import { ImportService } from "../api/merge/importWhitelist.service";
import { WhitelistDbService } from "./whitelist-db/whitelist-db.service";

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
      {
        name: Whitelist.name,
        schema: WhitelistSchema,
      },
    ]),
    WeweConfigModule,
  ],
  providers: [
    Logger,
    VaultDbService,
    ProgressMetadataDbService,
    RewardsConvertedToUsdcDbService,
    PriceDbService,
    ImportService,
    WhitelistDbService,
  ],
  exports: [
    VaultDbService,
    ProgressMetadataDbService,
    RewardsConvertedToUsdcDbService,
    PriceDbService,
    ImportService,
    WhitelistDbService,
  ],
})
export class DatabaseModule {}
