import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ProgressMetadataDocument } from "../schemas/ProgressMetadata";
import { Address } from "viem";
import { AggregationType } from "../../shared/enum/AggregationType";
import { ProgressMetadataDto } from "../db-models";

@Injectable()
export class ProgressMetadataDbService {
  private readonly logger = new Logger(ProgressMetadataDbService.name);

  constructor(
    @InjectModel(ProgressMetadataDocument.name) private progressMetadataModel: Model<ProgressMetadataDocument>,
  ) {}

  public async getLastBlockNumber(address: Address, operation: AggregationType): Promise<bigint | undefined> {
    const result = await this.progressMetadataModel
      .find({
        address: address.toLowerCase(),
        aggregationType: operation,
      })
      .sort({
        timestamp: -1,
      })
      .limit(1)
      .exec();

    if (result && result.length > 0) {
      return BigInt(result[0].lastBlockNumber);
    } else {
      return undefined;
    }
  }

  public async saveProgressMetadata(value: ProgressMetadataDto): Promise<ProgressMetadataDocument | null> {
    this.logger.debug(
      `Attempting to save progress metadata: vaultAddress=${value.address}, aggregationType=${value.aggregationType}, lastBlockNumber=${value.lastBlockNumber}`,
    );

    try {
      const existingRecord = await this.progressMetadataModel.findOne({
        address: value.address.toLowerCase(),
        aggregationType: value.aggregationType,
      });

      if (existingRecord) {
        if (existingRecord.lastBlockNumber < value.lastBlockNumber) {
          this.logger.log(
            `Updating lastBlockNumber for vaultAddress=${value.address}, aggregationType=${value.aggregationType}: ${existingRecord.lastBlockNumber} -> ${value.lastBlockNumber}`,
          );
          existingRecord.lastBlockNumber = value.lastBlockNumber;
          const updatedRecord = await existingRecord.save();
          this.logger.debug(
            `Successfully updated progress metadata for vaultAddress=${value.address}, aggregationType=${value.aggregationType}`,
          );
          return updatedRecord;
        } else {
          this.logger.debug(
            `No update required for vaultAddress=${value.address}, aggregationType=${value.aggregationType}. Existing lastBlockNumber (${existingRecord.lastBlockNumber}) is >= new lastBlockNumber (${value.lastBlockNumber}).`,
          );
          return null;
        }
      } else {
        this.logger.log(
          `No existing progress metadata found for vaultAddress=${value.address}, aggregationType=${value.aggregationType}. Creating new entry.`,
        );
        const newDocument = new this.progressMetadataModel(value);
        const savedDocument = await newDocument.save();
        this.logger.debug(
          `Successfully created new progress metadata for vaultAddress=${value.address}, aggregationType=${value.aggregationType}`,
        );
        return savedDocument;
      }
    } catch (e) {
      if (e.code === 11000) {
        this.logger.warn(
          `Duplicate key error while saving progress metadata: vaultAddress=${value.address}, aggregationType=${value.aggregationType}. Ignoring duplicate entry.`,
        );
        return null;
      } else {
        this.logger.error(
          `Failed to save/update progress metadata for vaultAddress=${value.address}, aggregationType=${value.aggregationType}. Error: ${e.message}`,
          e.stack,
        );
        throw e;
      }
    }
  }
}
