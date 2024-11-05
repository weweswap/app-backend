import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type WhitelistDocument = Whitelist & Document;

@Schema({ collection: "whitelist" })
export class Whitelist {
  @Prop({ required: true, unique: true, index: true })
  address: string;

  @Prop({ required: true })
  amount: string;

  @Prop({ required: true, type: [String] })
  proof: string[];

  @Prop({ required: true, index: true })
  mergeProject: string;
}

export const WhitelistSchema = SchemaFactory.createForClass(Whitelist);
WhitelistSchema.index({ project: 1, address: 1 }, { unique: true });
