import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Logger,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from "@nestjs/common";
import { LpService } from "./lp.service";
import { ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { Address } from "viem";
import { VaultInfoResponseDto } from "../../dto/VaultInfoResponseDto";
import { GetAprParamsDto } from "../../dto/GetVaultInfoParamsDto";

@Controller("api")
@ApiTags("Vault Info")
export class LpController {
  private readonly logger = new Logger(LpController.name);

  constructor(private readonly lpService: LpService) {}

  @Get("/:address")
  @ApiOperation({
    summary: "Get vault details",
    description: "Fetches details for a specific vault by address.",
  })
  @ApiParam({
    name: "address",
    required: true,
    description: "Ethereum address of the vault",
    type: String,
  })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true, // Optionally strip unknown properties
      forbidNonWhitelisted: true, // Optionally throw error on unknown properties
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      exceptionFactory: (errors) => new BadRequestException("Not a valid Ethereum Address"),
    }),
  )
  async getApr(@Param() params: GetAprParamsDto): Promise<VaultInfoResponseDto> {
    const { address } = params;
    try {
      return await this.lpService.getApr(address.toLowerCase() as Address);
    } catch (error) {
      this.logger.error(`Error fetching vault information for address ${address}: ${error}`);
      throw new NotFoundException("Vault Address not found");
    }
  }
}
