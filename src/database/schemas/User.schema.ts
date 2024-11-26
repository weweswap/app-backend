import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({
  collection: "users",
  timestamps: true, // Automatically manages createdAt and updatedAt fields
})
export class UserDocument extends Document {
  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true, // Creates an index for faster queries
  })
  userAddress: string;

  @Prop({
    type: Number,
    default: 0,
    required: true,
  })
  mergerCHAOSPoints: number;

  @Prop({
    type: Number,
    default: 0,
    required: true,
  })
  lpCHAOSPoints: number;

  @Prop({
    type: Number,
    default: 0,
    required: true,
  })
  totalCHAOSPoints: number;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);

// Ensure that the unique index is created in MongoDB
UserSchema.index({ userAddress: 1 }, { unique: true });
UserSchema.index({ totalCHAOSPoints: -1 });
