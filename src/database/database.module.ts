import { Logger, Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { VaultDbService } from "./vault-db/vault-db.service";
import { CollectVaultFeeEventDocument, CollectVaultFeeEventSchema } from "./schemas/CollectedVaultFeeEvent.schema";
import { VaultHistoricalDocument, VaultsHistoricalDocumentSchema } from "./schemas/VaultHistoricalData.schema";
import { WeweConfigModule } from "../config/wewe-data-aggregator-config.module";
import { ProgressMetadataDocument, ProgressMetadataSchema } from "./schemas/ProgressMetadata";
import { ProgressMetadataDbService } from "./progress-metadata/progress-metadata-db.service";

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
    ]),
    WeweConfigModule,
  ],
  providers: [Logger, VaultDbService, ProgressMetadataDbService],
  exports: [VaultDbService, ProgressMetadataDbService],
})
export class DatabaseModule {}
