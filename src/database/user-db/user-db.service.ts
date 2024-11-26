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

  /**
   * Retrieves the top 10 users sorted by totalCHAOSPoints in descending order.
   *
   * @returns {Promise<UserDocument[]>} An array of the top 10 users.
   */
  async getTop10UsersByTotalCHAOSPoints(): Promise<UserDocument[]> {
    return this.userModel
      .find()
      .sort({ totalCHAOSPoints: -1 }) // Sorts in descending order
      .limit(10) // Limits the result to top 10
      .exec();
  }

  /**
   * Counts the number of users with more totalCHAOSPoints than the specified value.
   *
   * @param {number} totalChaosPoints - The total CHAOS points to compare against.
   * @returns {Promise<number>} The count of users with more points.
   */
  async countUsersWithMorePoints(totalChaosPoints: number): Promise<number> {
    return this.userModel.countDocuments({ totalCHAOSPoints: { $gt: totalChaosPoints } }).exec();
  }
}
