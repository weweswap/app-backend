import { BadRequestException, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { WeweConfigService } from "../../config/wewe-data-aggregator-config.service";
import { ArrakisContractsService } from "../../contract-connectors/arrakis-contracts/arrakis-contracts.service";
import { HttpService } from "@nestjs/axios";
import { Address } from "viem";
import { firstValueFrom } from "rxjs";
import { AxiosResponse } from "axios";
import { KyberSwapResponse } from "../../shared/types/kyberswap";
import { ITokenPair } from "../../shared/interface/ITokenPair";
import { KyberswapConfig } from "../../shared/class/KyberswapConfig";
import { GetZapOutRouteBodyDto } from "../../dto/GetZapOutRouteBodyDto";
import Big from "big.js";
import { EvmConnectorService } from "../../blockchain-connectors/evm-connector/evm-connector.service";

@Injectable()
export class ZapOutService {
  private readonly logger = new Logger(ZapOutService.name);
  private readonly kyberswapConfig: KyberswapConfig;

  constructor(
    private readonly configService: WeweConfigService,
    private readonly arrakisContractsService: ArrakisContractsService,
    private readonly httpService: HttpService,
    private readonly evmConnector: EvmConnectorService,
  ) {
    this.kyberswapConfig = this.configService.kyberswapConfig;
  }

  public async getZapOutRoute(zapOutRouteBodyDto: GetZapOutRouteBodyDto) {
    try {
      const vaultAddress = zapOutRouteBodyDto.vaultAddress as Address;

      const tokens = await this.arrakisContractsService.getTokens(vaultAddress);

      await this.validateTokenToSwap(zapOutRouteBodyDto, tokens);

      return await this.processZapOutRoute(
        vaultAddress,
        zapOutRouteBodyDto.sharesToBurn,
        zapOutRouteBodyDto.tokenToSwap,
        tokens,
      );
    } catch (error) {
      this.handleError(error, "Failed to get Zap Out route");
    }
  }

  private async validateTokenToSwap(dto: GetZapOutRouteBodyDto, tokens: ITokenPair): Promise<void> {
    if (
      dto.tokenToSwap.toLowerCase() !== tokens.token0.address.toLowerCase() &&
      dto.tokenToSwap.toLowerCase() !== tokens.token1.address.toLowerCase()
    ) {
      throw new BadRequestException("Invalid token to swap or vault address - does not match token0 or token1");
    }
  }

  private async fetchKyberSwapRoute(tokenIn: string, tokenOut: string, amountIn: bigint): Promise<KyberSwapResponse> {
    const kyberSwapApiUrl = `${this.kyberswapConfig.url}/base/api/v1/routes`;
    const params = { tokenIn, tokenOut, amountIn: amountIn.toString() };

    this.logger.debug(`Fetching KyberSwap route with params: ${JSON.stringify(params)}`);

    try {
      const response = await this.makeHttpRequest<KyberSwapResponse>("GET", kyberSwapApiUrl, { params });
      return response;
    } catch (error) {
      this.logger.error("Failed to fetch KyberSwap route", error);
      throw new InternalServerErrorException("Failed to fetch swap route from KyberSwap");
    }
  }

  private async buildKyberSwapRoute(kyberSwapResult: KyberSwapResponse): Promise<string> {
    const buildRouteUrl = `${this.kyberswapConfig.url}/${this.kyberswapConfig.chain}/api/v1/route/build`;
    const routeSummary = kyberSwapResult.data.routeSummary;

    const buildRouteBody = {
      routeSummary: {
        ...routeSummary,
      },
      sender: this.kyberswapConfig.senderAddress,
      recipient: this.kyberswapConfig.recipientAddress,
      slippageTolerance: this.kyberswapConfig.slippageTolerance,
    };

    this.logger.debug(`Building KyberSwap route with body: ${JSON.stringify(buildRouteBody)}`);

    try {
      const response = await this.makeHttpRequest<any>("POST", buildRouteUrl, { data: buildRouteBody });
      if (response.code !== 0) {
        this.logger.error(`KyberSwap Route Build API error: ${response.message}`);
        throw new InternalServerErrorException(`KyberSwap Route Build API error: ${response.message}`);
      }
      this.logger.debug(`KyberSwap Route Build result: ${JSON.stringify(response)}`);
      return response.data.data;
    } catch (error) {
      this.logger.error("Failed to build KyberSwap route", error);
      throw new InternalServerErrorException("Failed to build KyberSwap route");
    }
  }

  private async makeHttpRequest<T>(method: "GET" | "POST", url: string, options: any): Promise<T> {
    const requestStartTime = Date.now();

    options.headers = {
      ...options.headers,
      "x-client-id": this.kyberswapConfig.clientId,
    };

    try {
      const response: AxiosResponse<T> =
        method === "GET"
          ? await firstValueFrom(
              this.httpService.get(url, {
                ...options,
                headers: options.headers,
              }),
            )
          : await firstValueFrom(
              this.httpService.post(url, options.data, {
                ...options,
                headers: options.headers,
              }),
            );

      if (response.status !== 200) {
        throw new InternalServerErrorException(`API responded with status ${response.status}`);
      }

      return response.data;
    } catch (error) {
      this.handleHttpError(error, url);
    } finally {
      const duration = Date.now() - requestStartTime;
      this.logger.debug(`HTTP ${method} request to ${url} completed in ${duration}ms`);
    }
  }

  private constructResponse(
    tokenInAmount: bigint,
    tokenInAddress: string,
    tokenOutAddress: string,
    kyberSwapResult: KyberSwapResponse,
    encodedRoute: string,
  ) {
    return {
      swapAmount: tokenInAmount.toString(),
      swapFromToken: tokenInAddress,
      swapToToken: tokenOutAddress,
      kyberSwapRoute: kyberSwapResult.data.routeSummary,
      kyberSwapEncodedRoute: encodedRoute,
    };
  }

  private handleError(error: any, fallbackMessage: string): never {
    this.logger.error(error.message);
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new InternalServerErrorException(fallbackMessage);
  }

  private handleHttpError(error: any, url: string): never {
    const errorMessage = error.response?.data
      ? {
          code: error.response.data.code,
          message: error.response.data.message,
          requestId: error.response.data.requestId,
          details: error.response.data.details,
        }
      : `Request to ${url} failed: ${error.message}`;

    this.logger.error(`HTTP request failed: ${JSON.stringify(errorMessage)}`);
    throw new InternalServerErrorException(errorMessage);
  }

  private async processZapOutRoute(
    vaultAddress: Address,
    sharesToBurn: string,
    tokenToSwap: string,
    tokens: ITokenPair,
  ) {
    const totalSupply = await this.arrakisContractsService.getTotalSupply(vaultAddress);

    const sharesInPercentage = Big(sharesToBurn).div(Big(totalSupply.toString()));
    const vaultConfig = this.configService.getArrakisVaultConfig(vaultAddress);
    const blockNumber = await this.evmConnector.getCurrentBlockNumber();

    const underlyingTokenHoldings = await this.arrakisContractsService.getUnderlyingTokenHoldings(
      vaultConfig,
      Number(blockNumber),
    );

    console.log(sharesInPercentage.toString());
    console.log(underlyingTokenHoldings[0].toString());
    console.log(underlyingTokenHoldings[1].toString());

    const token0Share = underlyingTokenHoldings[0].mul(sharesInPercentage);
    const token1Share = underlyingTokenHoldings[1].mul(sharesInPercentage);

    console.log(token0Share.toString());
    console.log(token1Share.toString());

    let tokenInAddress: Address;
    let tokenInAmount: bigint;
    let tokenOutAddress: Address;

    if (tokenToSwap === tokens.token0.address) {
      tokenInAddress = tokens.token0.address;
      tokenInAmount = BigInt(Math.ceil(token0Share.toNumber()));
      tokenOutAddress = tokens.token1.address;
    } else {
      tokenInAddress = tokens.token1.address;
      tokenInAmount = BigInt(Math.ceil(token1Share.toNumber()));
      tokenOutAddress = tokens.token0.address;
    }

    const kyberSwapResult = await this.fetchKyberSwapRoute(tokenInAddress, tokenOutAddress, tokenInAmount);

    // Validate kyberSwapResult
    this.validateKyberSwapResult(kyberSwapResult);

    const encodedRoute = await this.buildKyberSwapRoute(kyberSwapResult);

    return this.constructResponse(tokenInAmount, tokenInAddress, tokenOutAddress, kyberSwapResult, encodedRoute);
  }

  private validateKyberSwapResult(result: KyberSwapResponse): void {
    if (!result?.data?.routeSummary) {
      throw new InternalServerErrorException("Invalid KyberSwap response format");
    }

    const { amountIn, amountOut, tokenIn, tokenOut } = result.data.routeSummary;

    if (!amountIn || !amountOut || !tokenIn || !tokenOut) {
      throw new InternalServerErrorException("Missing required fields in KyberSwap response");
    }

    if (BigInt(amountOut) <= 0n) {
      throw new InternalServerErrorException("Invalid amount out from KyberSwap");
    }
  }
}
