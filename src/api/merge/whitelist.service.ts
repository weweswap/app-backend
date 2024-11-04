import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Whitelist, WhitelistDocument } from "../../database/schemas/WhitelistData.schema";

//TODO refactor
@Injectable()
export class WhitelistService {
  constructor(@InjectModel(Whitelist.name) private keyValueModel: Model<WhitelistDocument>) {}

  /**
   * Retrieves the proof array for a given address.
   * @param address - The address to query.
   * @returns The proof array associated with the address.
   * @throws NotFoundException if the address does not exist.
   */
  async getProofByAddress(address: string): Promise<string[]> {
    const keyValue = await this.keyValueModel.findOne({ address }).exec();
    if (!keyValue) {
      throw new NotFoundException(`Address '${address}' not found`);
    }
    return keyValue.proof;
  }
}
