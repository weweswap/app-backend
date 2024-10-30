import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { MergeService } from "./merge.service";
import { ApiNotFoundResponse, ApiOperation, ApiParam, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { MergeChartDatapoint } from "../../dto/MergeChartDto";
import { GetMergeChartParamsDto } from "../../dto/GetMergeChartParamsDto";
import { HistoricDataQueryParamsDto } from "../../dto/HistoricDataQueryParamsDto";
import { ethers } from "ethers";

@Controller("api/merge")
export class MergeController {
  private readonly logger = new Logger(MergeController.name);

  constructor(private readonly mergeService: MergeService) { }

  @Get("/:coinId")
  @ApiOperation({
    summary: "Get Merge chart for a specific coin",
    description: "Retrieve chart information for WEWE and the to be merged coin.",
  })
  @ApiParam({
    name: "coinId",
    type: "string",
    description: "Name of the merge coin",
    example: "brokkr",
  })
  @ApiQuery({
    name: "timeframe",
    required: false,
    type: String,
    enum: ["daily", "weekly", "monthly"],
    description: "Timeframe for historic chart data.",
    example: "daily",
  })
  @ApiResponse({
    status: 200,
    description: "Successfully retrieved chart information.",
    type: MergeChartDatapoint,
    isArray: true,
  })
  @ApiNotFoundResponse({
    description: "Merge Coin not found",
  })
  @UsePipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors) => new BadRequestException(`Bad Request: ${errors}`),
    }),
  )
  async getMergeChart(
    @Param() params: GetMergeChartParamsDto,
    @Query() queryParams: HistoricDataQueryParamsDto,
  ): Promise<MergeChartDatapoint[]> {
    const { coinId } = params;
    try {
      return await this.mergeService.getMergeChart(coinId.toLowerCase(), queryParams.timeframe);
    } catch (error) {
      this.logger.error(`Error fetching merge chart information for coin ${coinId}: ${error}`);
      throw new NotFoundException("Merge Coin not found");
    }
  }

  @Post("/whitelist/:address")
  @ApiOperation({
    summary: "",
    description: ".",
  })
  @ApiParam({
    name: "address",
    type: "string",
    description: "Users ETH address",
    example: "0x0000000000000000000000000000000000000000",
  })
  @ApiResponse({
    status: 200,
    description: "Successful tx hash.",
    type: String,
  })
  @ApiNotFoundResponse({
    description: "Address not found",
  })
  async setWhitelabel(@Param() param: string): Promise<string> {
    const address = param;
    try {
      if (!ethers.isAddress(address)) {
        throw new Error("Invalid address");
      }

      // Check if address is in whitelist
      const abi = [
        {
          constant: true,
          inputs: [{ name: "account", type: "address" }],
          name: "isWhitelisted",
          outputs: [{ name: "", type: "bool" }],
          payable: false,
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "address",
              name: "",
              type: "address",
            },
          ],
          name: "whiteList",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ];

      const privateKey = process.env.PRIVATE_KEY;
      const contractAddress = process.env.CONTRACT_ADDRESS;

      if (!privateKey || !contractAddress) {
        throw new Error("Missing environment variables");
      }

      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const signer = new ethers.Wallet(privateKey);

      const contract = new ethers.Contract(contractAddress, abi, provider);
      const contractWithSigner = contract.connect(signer);

      const isWhitelisted = await contractWithSigner.whiteList(address);
      if (isWhitelisted) {
        return "Already whitelisted";
      }

      const tx = await contractWithSigner.addWhiteList(address);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Error setting white list for ${address}: ${error}`);
      throw new NotFoundException("Address not found");
    }
  }
}
