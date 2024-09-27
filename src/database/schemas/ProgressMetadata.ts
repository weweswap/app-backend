import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { AggregationType } from "../../shared/enum/AggregationType";

@Schema({
  collection: "progressMetadata",
  autoCreate: true,
  autoIndex: true,
})
export class ProgressMetadataDocument extends Document {
  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  address: string;

  @Prop({
    type: Number,
    isRequired: true,
  })
  lastBlockNumber: number; // last block number synced

  @Prop({
    type: String,
    enum: AggregationType,
    isRequired: true,
  })
  aggregationType: AggregationType; // type of aggregation
}

export const ProgressMetadataSchema = SchemaFactory.createForClass(ProgressMetadataDocument);
ProgressMetadataSchema.index({ address: 1, aggregationType: 1 }, { unique: true });
