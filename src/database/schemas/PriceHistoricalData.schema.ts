import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument } from "mongoose";
@Schema({
  _id: false,
})
export class PriceHistoricalMetadata extends Document {
  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  coinId: string;

  @Prop({ isRequired: true })
  price: number;
}

export const PriceHistoricalMetadataSchema = SchemaFactory.createForClass(PriceHistoricalMetadata);

@Schema({
  collection: "priceData",
  autoCreate: true,
  autoIndex: true,
})
export class PriceHistoricalDocument extends Document {
  @Prop({
    type: Date,
    isRequired: true,
  })
  timestamp: Date; // The primary date field for time series data

  @Prop({
    type: PriceHistoricalMetadataSchema,
    isRequired: true,
  })
  metadata: PriceHistoricalMetadata;
}

export type PriceHistoricalDataDocument = HydratedDocument<PriceHistoricalDocument>;

export const PriceHistoricalDocumentSchema = SchemaFactory.createForClass(PriceHistoricalDocument);
PriceHistoricalDocumentSchema.index({ timestamp: 1, "metadata.coinId": 1 }, { unique: true });
