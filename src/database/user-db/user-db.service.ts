import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, Model } from "mongoose";
import { UserDocument } from "../schemas/User.schema";
import { MongoServerError } from "mongodb";

@Injectable()
export class UserDbService {
  private readonly logger = new Logger(UserDbService.name);

  constructor(
    @InjectModel(UserDocument.name)
    private userModel: Model<UserDocument>,
  ) {}

  /**
   * Updates LP points with retry logic.
   *
   * @param userAddress - Address of the user.
   * @param points - Points to increment.
   * @param session - MongoDB client session.
   */
  async performTransactionalUpdate(
    userAddress: string,
    points: number,
    session: ClientSession,
    maxRetries: number = 5,
    retryDelay: number = 100, // in milliseconds
  ): Promise<void> {
    const filter = { userAddress };
    const update = { $inc: { lpCHAOSPoints: points, totalCHAOSPoints: points } };
    const options = { upsert: true };

    let attempt = 0;
    let currentDelay = retryDelay;

    while (attempt < maxRetries) {
      try {
        await this.userModel.findOneAndUpdate(filter, update, { ...options, session }).exec();
        return; // Success
      } catch (error) {
        if (
          error instanceof MongoServerError &&
          (error.hasErrorLabel("TransientTransactionError") ||
            error.code === 112 || // Write conflict
            error.code === 251) // UnknownTransactionCommitResult
        ) {
          attempt++;
          this.logger.warn(
            `Transient error updating LP points for user ${userAddress}. Retry attempt ${attempt} after ${currentDelay}ms.`,
          );
          await new Promise((resolve) => setTimeout(resolve, currentDelay));
          currentDelay *= 2; // Exponential backoff
        } else {
          this.logger.error(
            `Non-transient error updating LP points for user ${userAddress}: ${error.message}`,
            error.stack,
          );
          throw error; // Rethrow non-transient errors
        }
      }
    }
    throw new Error(`Failed to update LP points for user ${userAddress} after ${maxRetries} attempts.`);
  }

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
