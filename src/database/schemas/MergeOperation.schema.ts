import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({
  _id: false,
})
export class MergeOperationMetadata extends Document {
  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  mergeContractAddress: string;

  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  userAddress: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  mergeCoinAmount: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  weweAmount: string;

  @Prop({
    type: String,
    isRequired: true,
  })
  usdcValue: string;

  @Prop({
    type: Number,
    isRequired: true,
  })
  blockNumber: number;
}

export const MergeOperationMetadataSchema = SchemaFactory.createForClass(MergeOperationMetadata);

@Schema({
  collection: "mergeOperation",
  autoCreate: true,
  autoIndex: true,
})
export class MergeOperationDocument extends Document {
  @Prop({
    type: String,
    isRequired: true,
    lowercase: true,
  })
  _id: string; // eventId

  @Prop({
    type: Date,
    isRequired: true,
  })
  timestamp: Date; // The primary date field for time series data

  @Prop({
    type: MergeOperationMetadataSchema,
    isRequired: true,
  })
  metadata: MergeOperationMetadata;
}

export const MergeOperationSchema = SchemaFactory.createForClass(MergeOperationDocument);
MergeOperationSchema.index(
  { timestamp: 1, "metadata.userAddress": 1, "metadata.mergeContractAddress": 1 },
  { unique: true },
);

export class MergeOperationDto {
  constructor(
    public _id: string,
    public timestamp: Date,
    public metadata: MergeOperationMetadataDto,
  ) {}
}

export class MergeOperationMetadataDto {
  constructor(
    public mergeContractAddress: string,
    public userAddress: string,
    public mergeCoinAmount: string,
    public weweAmount: string,
    public usdcValue: string,
    public blockNumber: number,
  ) {}
}
