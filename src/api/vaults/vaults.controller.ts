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
import { VaultsService } from "./vaults.service";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Address } from "viem";
import { VaultInfoResponseDto } from "../../dto/VaultInfoResponseDto";
import { GetVaultInfoParamsDto } from "../../dto/GetVaultInfoParamsDto";

@Controller("api")
@ApiTags("Vault Info")
export class VaultsController {
  private readonly logger = new Logger(VaultsController.name);

  constructor(private readonly vaultService: VaultsService) {}

  @Get("/:address")
  @ApiOperation({
    summary: "Get Vault Information",
    description: "Retrieve information about a vault using its address.",
  })
  @ApiParam({
    name: "address",
    type: "string",
    description: "Address of the vault",
    example: "0x1234567890abcdef1234567890abcdef12345678",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved vault information.",
    type: VaultInfoResponseDto,
  })
  @ApiBadRequestResponse({
    description: "Not a valid Ethereum Address",
  })
  @ApiNotFoundResponse({
    description: "Vault address not found.",
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
  async getVaultInfo(@Param() params: GetVaultInfoParamsDto): Promise<VaultInfoResponseDto> {
    const { address } = params;
    try {
      return await this.vaultService.getVaultInfo(address.toLowerCase() as Address);
    } catch (error) {
      this.logger.error(`Error fetching vault information for address ${address}: ${error}`);
      throw new NotFoundException("Vault Address not found");
    }
  }
}
