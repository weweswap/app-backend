import { Injectable } from "@nestjs/common";
import { WhitelistDbService } from "../../database/whitelist-db/whitelist-db.service";
import { WhitelistInfoDto, WhitelistInfoResponseDto } from "../../dto/WhitelistInfoResponseDto";
import { Address } from "viem";

@Injectable()
export class WhitelistService {
  constructor(private readonly whitelistDbService: WhitelistDbService) {}

  async getWhitelistInfo(projectAddress: string, userAddress: string): Promise<WhitelistInfoResponseDto> {
    const whitelistEntry = await this.whitelistDbService.getWhitelistInfo(projectAddress, userAddress);
    const whitelistInfoDto = new WhitelistInfoDto(
      whitelistEntry.mergeProject as Address,
      whitelistEntry.address as Address,
      whitelistEntry.amount,
      whitelistEntry.proof,
    );

    const whitelistResponse: WhitelistInfoResponseDto = {
      whitelistInfo: whitelistInfoDto,
    };

    return whitelistResponse;
  }
}
