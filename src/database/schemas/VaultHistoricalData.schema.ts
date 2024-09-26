import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument } from "mongoose";
@Schema({
  _id: false,
})
export class VaultHistoricalMetadata extends Document {
  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  vaultAddress: string; // vault address

  @Prop({ isRequired: true })
  tvlUsd: number;

  @Prop({ isRequired: true })
  vaultTokenPrice: number;

  @Prop({ isRequired: true })
  token0Price: number;

  @Prop({ isRequired: true })
  token1Price: number;
}

export const VaultHistoricalMetadataSchema = SchemaFactory.createForClass(VaultHistoricalMetadata);

@Schema({
  collection: "vaultsData",
  autoCreate: true,
  autoIndex: true,
})
export class VaultHistoricalDocument extends Document {
  @Prop({
    type: Date,
    isRequired: true,
  })
  timestamp: Date; // The primary date field for time series data

  @Prop({
    type: VaultHistoricalMetadataSchema,
    isRequired: true,
  })
  metadata: VaultHistoricalMetadata;
}

export type VaultHistoricalDataDocument = HydratedDocument<VaultHistoricalDocument>;

export const VaultsHistoricalDocumentSchema = SchemaFactory.createForClass(VaultHistoricalDocument);
VaultsHistoricalDocumentSchema.index({ timestamp: 1, "metadata.vaultAddress": 1 }, { unique: true });
