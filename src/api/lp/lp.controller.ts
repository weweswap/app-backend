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
import { LpResponseDto } from "../../shared/class/LpResponseDto";
import { Address } from "viem";

@Controller("api")
@ApiTags("APR")
export class LpController {
  private readonly logger = new Logger(LpController.name);

  constructor(private readonly lpService: LpService) {}

  @Get("/:address")
  @ApiOperation({
    summary: "Get lp management strategy details",
    description: "Fetches details for a specific lp management strategy by address.",
  })
  @ApiParam({
    name: "address",
    required: true,
    description: "Ethereum address of the lp management strategy",
    type: String,
  })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: () => new BadRequestException("Not a valid Ethereum Address"),
    }),
  )
  async getApr(@Param("address", new ValidationPipe({ transform: true })) address: string): Promise<LpResponseDto> {
    try {
      return await this.lpService.getApr(address.toLowerCase() as Address);
    } catch (error) {
      this.logger.error(`Error fetching lp details for address ${address}: ${error}`);

      throw new NotFoundException("Lp Strategy Address not found");
    }
  }
}
