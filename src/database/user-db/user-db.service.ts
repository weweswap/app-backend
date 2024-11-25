import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, Model } from "mongoose";
import { UserDocument } from "../schemas/User.schema";

@Injectable()
export class UserDbService {
  constructor(
    @InjectModel(UserDocument.name)
    private userModel: Model<UserDocument>,
  ) {}

  async updateMergerPoints(userAddress: string, points: number): Promise<void> {
    await this.userModel
      .findOneAndUpdate(
        { userAddress },
        {
          $inc: { mergerCHAOSPoints: points, totalCHAOSPoints: points },
        },
        { upsert: true },
      )
      .exec();
  }

  async updateLpPoints(userAddress: string, points: number, session?: ClientSession): Promise<void> {
    await this.userModel
      .findOneAndUpdate(
        { userAddress },
        {
          $inc: { lpCHAOSPoints: points, totalCHAOSPoints: points },
        },
        { upsert: true, session },
      )
      .exec();
  }

  async getUserPoints(userAddress: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ userAddress }).exec();
  }
}
