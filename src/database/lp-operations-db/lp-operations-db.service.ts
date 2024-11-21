import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Address } from "viem";
import { LpOperationDocument, LpOperationDto } from "../schemas/LpOperation.schema";
import { OperationType } from "../../shared/enum/OperationType";

@Injectable()
export class LpOperationsDbService {
  private readonly logger = new Logger(LpOperationsDbService.name);

  constructor(
    @InjectModel(LpOperationDocument.name)
    private lpOperationModel: Model<LpOperationDocument>,
  ) {}

  public async getMostRecentOperationBlockNumber(
    vaultAddress: Address,
    operation: OperationType,
  ): Promise<bigint | undefined> {
    const result = await this.lpOperationModel
      .find({
        "metadata.vaultAddress": vaultAddress.toLowerCase(),
        "metadata.operationType": operation,
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
      const exists = await this.lpOperationModel.exists({ _id: eventId.toLowerCase() });
      return !!exists;
    } catch (error) {
      this.logger.error(`Error checking if entry exists for ID ${eventId}: ${error.message}`, error.stack);
      throw error;
    }
  }

  public async saveArrakisVaultOperation(operation: LpOperationDto): Promise<boolean> {
    this.logger.debug("saveLpOperation..");

    try {
      const newOperation = new this.lpOperationModel(operation);

      return !!(await newOperation.save());
    } catch (e) {
      // Check if the error is a duplicate key error (11000 is the MongoDB error code for duplicate key error)
      if (e.code === 11000) {
        this.logger.warn("Duplicate key error. Ignoring.");
        return true;
      } else {
        this.logger.error(`Failed to save lp operation.. Error: ${JSON.stringify(e, null, 2)}`);

        // Re-throw the error if it's not a duplicate key error
        throw e;
      }
    }
  }
}
