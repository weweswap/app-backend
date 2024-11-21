import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Address } from "viem";
import { MergeOperationDocument, MergeOperationDto } from "../schemas/MergeOperation.schema";

@Injectable()
export class MergeOperationsDbService {
  private readonly logger = new Logger(MergeOperationsDbService.name);

  constructor(
    @InjectModel(MergeOperationDocument.name)
    private mergeOperationModel: Model<MergeOperationDocument>,
  ) {}

  public async getMostRecentOperationBlockNumber(mergeContractAddress: Address): Promise<bigint | undefined> {
    const result = await this.mergeOperationModel
      .find({
        "metadata.mergeContractAddress": mergeContractAddress.toLowerCase(),
      })
      .sort({
        timestamp: -1,
      })
      .limit(1)
      .exec();

    if (result && result.length > 0) {
      return BigInt(result[0].metadata.blockNumber);
    } else {
      return undefined;
    }
  }

  public async checkIfEntryExists(eventId: string): Promise<boolean> {
    try {
      const exists = await this.mergeOperationModel.exists({ _id: eventId.toLowerCase() });
      return !!exists;
    } catch (error) {
      this.logger.error(`Error checking if entry exists for ID ${eventId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  public async saveMergeOperation(operation: MergeOperationDto): Promise<boolean> {
    this.logger.debug("saveMergeOperation..");

    try {
      const newOperation = new this.mergeOperationModel(operation);

      return !!(await newOperation.save());
    } catch (e) {
      // Check if the error is a duplicate key error (11000 is the MongoDB error code for duplicate key error)
      if (e.code === 11000) {
        this.logger.warn("Duplicate key error. Ignoring.");
        return true;
      } else {
        this.logger.error(`Failed to save merge operation.. Error: ${JSON.stringify(e, null, 2)}`);

        // Re-throw the error if it's not a duplicate key error
        throw e;
      }
    }
  }
}
