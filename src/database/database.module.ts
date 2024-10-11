import { Logger, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { VaultDbService } from "./vault-db/vault-db.service";
import { CollectVaultFeeEventDocument, CollectVaultFeeEventSchema } from "./schemas/CollectedVaultFeeEvent.schema";
import { VaultHistoricalDocument, VaultsHistoricalDocumentSchema } from "./schemas/VaultHistoricalData.schema";
import { WeweConfigModule } from "../config/wewe-data-aggregator-config.module";
import { ProgressMetadataDocument, ProgressMetadataSchema } from "./schemas/ProgressMetadata";
import { ProgressMetadataDbService } from "./progress-metadata/progress-metadata-db.service";
import { PriceHistoricalDocument, PriceHistoricalDocumentSchema } from "./schemas/PriceHistoricalData.schema";
import { PriceDbService } from "./price-db/price-db.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CollectVaultFeeEventDocument.name,
        schema: CollectVaultFeeEventSchema,
      },
      {
        name: VaultHistoricalDocument.name,
        schema: VaultsHistoricalDocumentSchema,
      },
      {
        name: ProgressMetadataDocument.name,
        schema: ProgressMetadataSchema,
      },
      {
        name: PriceHistoricalDocument.name,
        schema: PriceHistoricalDocumentSchema,
      },
    ]),
    WeweConfigModule,
  ],
  providers: [Logger, VaultDbService, ProgressMetadataDbService, PriceDbService],
  exports: [VaultDbService, ProgressMetadataDbService, PriceDbService],
})
export class DatabaseModule {}
