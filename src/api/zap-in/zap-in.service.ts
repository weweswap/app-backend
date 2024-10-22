import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { WeweConfigService } from "../../config/wewe-data-aggregator-config.service";
import { ArrakisContractsService } from "../../contract-connectors/arrakis-contracts/arrakis-contracts.service";
import { CoingeckoService } from "../../price-oracles/coingecko/coingecko.service";
import { HttpService } from "@nestjs/axios";
import { GetZapInRouteBodyDto } from "../../dto/GetZapInRouteBodyDto";
import { Address, formatUnits } from "viem";
import { firstValueFrom } from "rxjs";
import { AxiosResponse } from "axios";
import { KyberSwapResponse } from "../../shared/types/kyberswap";
import { Erc20Service } from "../../contract-connectors/erc-20/erc-20.service";
import { IToken } from "../../shared/interface/IToken";
import { ITokenPair } from "../../shared/interface/ITokenPair";

interface TokenWithCoingecko extends IToken {
  coinGeckoId: string; // e.g., "ethereum", "dai"
}

@Injectable()
export class ZapInService {
  private readonly logger = new Logger(ZapInService.name);

  private static readonly KYBERSWAP_API_URL = "https://aggregator-api.kyberswap.com";
  private static readonly KYBERSWAP_CHAIN = "base";
  private static readonly DEFAULT_SENDER = "0x9377daBe42574cFB0BA202ed1A3a133C68fA1Bfd"; // Consider moving to config
  private static readonly DEFAULT_SLIPPAGE_TOLERANCE = 500; // 5%

  constructor(
    private readonly configService: WeweConfigService,
    private readonly arrakisContractsService: ArrakisContractsService,
    private readonly coingeckoService: CoingeckoService,
    private readonly httpService: HttpService,
    private readonly erc20Service: Erc20Service,
  ) {}

  public async getZapInRoute(zapInRouteBodyDto: GetZapInRouteBodyDto) {
    try {
      const vaultAddress = zapInRouteBodyDto.vaultAddress as Address;
      this.validateInputToken(zapInRouteBodyDto.inputToken, vaultAddress);

      const [token0CoingeckoId, token1CoingeckoId, tokens] = await Promise.all([
        this.configService.getArrakisVaultToken0CoingeckoId(vaultAddress),
        this.configService.getArrakisVaultToken1CoingeckoId(vaultAddress),
        this.arrakisContractsService.getTokens(vaultAddress),
      ]);

      const tokensWithCoingecko: ITokenPair & {
        token0: TokenWithCoingecko;
        token1: TokenWithCoingecko;
      } = {
        token0: { ...tokens.token0, coinGeckoId: token0CoingeckoId },
        token1: { ...tokens.token1, coinGeckoId: token1CoingeckoId },
      };

      const { amount0Max, amount1Max, inputToken, outputToken } = await this.determineTokenAmounts(
        zapInRouteBodyDto,
        tokensWithCoingecko,
      );

      const arrakisResult = await this.fetchArrakisMintAmounts(vaultAddress, amount0Max, amount1Max);

      const [token0Price, token1Price] = await this.fetchTokenPrices(
        tokensWithCoingecko.token0,
        tokensWithCoingecko.token1,
      );

      const { ratioToken0, ratioToken1 } = this.calculateRatio(
        arrakisResult,
        tokensWithCoingecko,
        +token0Price,
        +token1Price,
      );

      const { tokenInAddress, tokenOutAddress, tokenInAmount } = this.calculateSwapAmounts(
        inputToken,
        outputToken,
        tokensWithCoingecko,
        ratioToken0,
        ratioToken1,
        +token0Price,
        +token1Price,
        amount0Max,
        amount1Max,
      );

      const kyberSwapResult = await this.fetchKyberSwapRoute(tokenInAddress, tokenOutAddress, tokenInAmount);

      const arrakisResultUpdated = await this.updateArrakisMintAmounts(
        vaultAddress,
        amount0Max,
        amount1Max,
        kyberSwapResult,
        tokensWithCoingecko,
      );

      const encodedRoute = await this.buildKyberSwapRoute(kyberSwapResult, ZapInService.DEFAULT_SENDER);

      return this.constructResponse(
        arrakisResultUpdated,
        tokenInAmount,
        tokenInAddress,
        tokenOutAddress,
        kyberSwapResult,
        encodedRoute,
      );
    } catch (error) {
      this.handleError(error, "Failed to get Zap In route");
    }
  }

  private validateInputToken(inputToken: string, vaultAddress: Address) {
    if (!inputToken || !vaultAddress) {
      throw new BadRequestException("Invalid input token or vault address");
    }
  }

  private async determineTokenAmounts(
    dto: GetZapInRouteBodyDto,
    tokens: ITokenPair & {
      token0: TokenWithCoingecko;
      token1: TokenWithCoingecko;
    },
  ): Promise<{
    amount0Max: bigint;
    amount1Max: bigint;
    inputToken: TokenWithCoingecko;
    outputToken: TokenWithCoingecko;
  }> {
    const inputTokenLower = dto.inputToken.toLowerCase();
    const token0Lower = tokens.token0.coinGeckoId.toLowerCase();
    const token1Lower = tokens.token1.coinGeckoId.toLowerCase();

    if (inputTokenLower === token0Lower) {
      const amount0Max = BigInt(dto.tokenInAmount);
      const amount1Max = await this.erc20Service.getErc20TokenTotalSupply(tokens.token1.address as Address);
      return {
        amount0Max,
        amount1Max,
        inputToken: tokens.token0,
        outputToken: tokens.token1,
      };
    } else if (inputTokenLower === token1Lower) {
      const amount1Max = BigInt(dto.tokenInAmount);
      const amount0Max = await this.erc20Service.getErc20TokenTotalSupply(tokens.token0.address as Address);
      return {
        amount0Max,
        amount1Max,
        inputToken: tokens.token1,
        outputToken: tokens.token0,
      };
    } else {
      throw new BadRequestException("Unsupported input token");
    }
  }

  private async fetchArrakisMintAmounts(
    vault: Address,
    amount0Max: bigint,
    amount1Max: bigint,
  ): Promise<readonly [bigint, bigint, bigint]> {
    this.logger.debug(`Fetching Arrakis mint amounts for vault ${vault}`);
    const input = { vault, amount0Max, amount1Max };
    return await this.arrakisContractsService.getMintAmounts(input);
  }

  private async fetchTokenPrices(token0: TokenWithCoingecko, token1: TokenWithCoingecko): Promise<[string, string]> {
    const timestamp = Date.now();
    this.logger.debug(`Fetching USD prices for tokens ${token0.coinGeckoId} and ${token1.coinGeckoId} at ${timestamp}`);
    return await Promise.all([
      this.coingeckoService.getTokenUsdPrice(token0.coinGeckoId, timestamp),
      this.coingeckoService.getTokenUsdPrice(token1.coinGeckoId, timestamp),
    ]);
  }

  private calculateRatio(
    arrakisResult: readonly [bigint, bigint, bigint],
    tokens: ITokenPair & {
      token0: TokenWithCoingecko;
      token1: TokenWithCoingecko;
    },
    token0Price: number,
    token1Price: number,
  ) {
    // Format and parse amount0
    const formattedAmount0Str = formatUnits(arrakisResult[0], tokens.token0.decimals);
    this.logger.debug(`Formatted Amount0 String: ${formattedAmount0Str}`);
    const formattedAmount0 = parseFloat(formattedAmount0Str);
    this.logger.debug(`Parsed Amount0: ${formattedAmount0}`);

    // Format and parse amount1
    const formattedAmount1Str = formatUnits(arrakisResult[1], tokens.token1.decimals);
    this.logger.debug(`Formatted Amount1 String: ${formattedAmount1Str}`);
    const formattedAmount1 = parseFloat(formattedAmount1Str);
    this.logger.debug(`Parsed Amount1: ${formattedAmount1}`);

    // Calculate USD values
    const token0UsdValue = formattedAmount0 * token0Price;
    const token1UsdValue = formattedAmount1 * token1Price;
    const totalUsdValue = token0UsdValue + token1UsdValue;
    this.logger.debug(`Total USD Value: ${totalUsdValue}`);

    // Check for total USD value being zero
    if (totalUsdValue === 0) {
      this.logger.error("Total USD value is zero, cannot compute ratios");
      throw new BadRequestException("Total USD value is zero, cannot compute ratios");
    }

    // Calculate ratios
    const ratioToken0 = token0UsdValue / totalUsdValue;
    const ratioToken1 = token1UsdValue / totalUsdValue;
    this.logger.debug(
      `Token Ratios - ${tokens.token0.ticker}: ${ratioToken0}, ${tokens.token1.ticker}: ${ratioToken1}`,
    );

    return { ratioToken0, ratioToken1 };
  }

  private calculateSwapAmounts(
    inputToken: TokenWithCoingecko,
    outputToken: TokenWithCoingecko,
    tokens: ITokenPair & {
      token0: TokenWithCoingecko;
      token1: TokenWithCoingecko;
    },
    ratioToken0: number,
    ratioToken1: number,
    token0Price: number,
    token1Price: number,
    amount0Max: bigint,
    amount1Max: bigint,
  ): {
    tokenInAddress: string;
    tokenOutAddress: string;
    tokenInAmount: bigint;
  } {
    const isToken0Input = inputToken.coinGeckoId.toLowerCase() === tokens.token0.coinGeckoId.toLowerCase();

    const tokenInMaxAmount = isToken0Input ? amount0Max : amount1Max;
    const tokenInPrice = isToken0Input ? token0Price : token1Price;
    const tokenOutRatio = isToken0Input ? ratioToken1 : ratioToken0;
    const tokenDecimals = isToken0Input ? tokens.token0.decimals : tokens.token1.decimals;

    const formattedAmountInMax = parseFloat(formatUnits(tokenInMaxAmount, tokenDecimals));
    const usdValueIn = formattedAmountInMax * tokenInPrice;
    this.logger.debug(
      `Swapping ${inputToken.ticker} (${inputToken.address}) for ${outputToken.ticker} (${outputToken.address})`,
    );
    this.logger.debug(`USD Value In: $${usdValueIn}`);

    const calculatedAmount = ((usdValueIn * tokenOutRatio) / tokenInPrice) * 10 ** tokenDecimals;
    const tokenInAmount = BigInt(Math.ceil(calculatedAmount));

    this.logger.debug(`Calculated Token In Amount (raw): ${calculatedAmount}`);
    this.logger.debug(`Final Token In Amount: ${tokenInAmount}`);

    return {
      tokenInAddress: inputToken.address,
      tokenOutAddress: outputToken.address,
      tokenInAmount,
    };
  }

  private async fetchKyberSwapRoute(tokenIn: string, tokenOut: string, amountIn: bigint): Promise<KyberSwapResponse> {
    const kyberSwapApiUrl = `${ZapInService.KYBERSWAP_API_URL}/base/api/v1/routes`;
    const params = { tokenIn, tokenOut, amountIn: amountIn.toString() };

    this.logger.debug(`Fetching KyberSwap route with params: ${JSON.stringify(params)}`);

    try {
      const response = await this.makeHttpRequest<KyberSwapResponse>("GET", kyberSwapApiUrl, { params });
      return response;
    } catch (error) {
      this.logger.error("Failed to fetch KyberSwap route", error);
      throw new BadRequestException("Failed to fetch swap route from KyberSwap");
    }
  }

  private async updateArrakisMintAmounts(
    vault: Address,
    amount0Max: bigint,
    amount1Max: bigint,
    kyberSwapResult: KyberSwapResponse,
    tokens: ITokenPair & {
      token0: TokenWithCoingecko;
      token1: TokenWithCoingecko;
    },
  ): Promise<readonly [bigint, bigint, bigint]> {
    // Log the incoming parameters
    this.logger.debug(`Updating Arrakis mint amounts for vault: ${vault}`);
    this.logger.debug(`Initial amount0Max: ${amount0Max.toString()}, amount1Max: ${amount1Max.toString()}`);

    // Extract and log the amountOut from KyberSwap result
    const amountOutStr = kyberSwapResult.data.routeSummary.amountOut;
    const amountOutTokenAddress = kyberSwapResult.data.routeSummary.tokenOut;
    this.logger.debug(`KyberSwap amountOut: ${amountOutStr}`);

    const updatedAmountOut = BigInt(amountOutStr);
    this.logger.debug(`Converted amountOut to bigint: ${updatedAmountOut.toString()}`);

    // Determine which amount to update and log the decision
    let updatedAmount0Max = amount0Max;
    let updatedAmount1Max = amount1Max;

    if (amountOutTokenAddress.toLowerCase() === tokens.token0.address.toLowerCase()) {
      updatedAmount0Max = updatedAmountOut;
      this.logger.debug(`Updated amount0Max to: ${updatedAmount0Max.toString()}`);
      this.logger.debug(`amount1Max remains: ${updatedAmount1Max.toString()}`);
    } else {
      updatedAmount1Max = updatedAmountOut;
      this.logger.debug(`amount1Max was updated to: ${updatedAmount1Max.toString()}`);
      this.logger.debug(`amount0Max remains: ${updatedAmount0Max.toString()}`);
    }

    // Prepare the input object for Arrakis mint amounts
    const input = {
      vault,
      amount0Max: updatedAmount0Max,
      amount1Max: updatedAmount1Max,
    };

    // Log the input object details (convert bigints to strings)
    this.logger.debug(
      `Calling getMintAmounts with input: { vault: ${input.vault}, amount0Max: ${input.amount0Max.toString()}, amount1Max: ${input.amount1Max.toString()} }`,
    );

    // Fetch the updated mint amounts
    try {
      const mintAmounts = await this.arrakisContractsService.getMintAmounts(input);
      this.logger.debug(
        `Received updated mint amounts: [${mintAmounts[0].toString()}, ${mintAmounts[1].toString()}, ${mintAmounts[2].toString()}]`,
      );
      return mintAmounts;
    } catch (error) {
      this.logger.error(`Failed to fetch updated mint amounts: ${error.message}`, error.stack);
      throw new BadRequestException("Failed to update Arrakis mint amounts");
    }
  }

  private async buildKyberSwapRoute(kyberSwapResult: KyberSwapResponse, sender: string): Promise<string> {
    const buildRouteUrl = `${ZapInService.KYBERSWAP_API_URL}/${ZapInService.KYBERSWAP_CHAIN}/api/v1/route/build`;
    const routeSummary = kyberSwapResult.data.routeSummary;

    const buildRouteBody = {
      routeSummary: {
        tokenIn: routeSummary.tokenIn,
        amountIn: routeSummary.amountIn,
        amountInUsd: routeSummary.amountInUsd,
        tokenOut: routeSummary.tokenOut,
        amountOut: routeSummary.amountOut,
        amountOutUsd: routeSummary.amountOutUsd,
        gas: routeSummary.gas,
        gasPrice: routeSummary.gasPrice,
        gasUsd: routeSummary.gasUsd,
        extraFee: routeSummary.extraFee,
        route: routeSummary.route,
      },
      sender,
      recipient: sender,
      slippageTolerance: ZapInService.DEFAULT_SLIPPAGE_TOLERANCE,
    };

    this.logger.debug(`Building KyberSwap route with body: ${JSON.stringify(buildRouteBody)}`);

    try {
      const response = await this.makeHttpRequest<any>("POST", buildRouteUrl, { data: buildRouteBody });
      if (response.code !== 0) {
        this.logger.error(`KyberSwap Route Build API error: ${response.message}`);
        throw new BadRequestException(`KyberSwap Route Build API error: ${response.message}`);
      }
      this.logger.debug(`KyberSwap Route Build result: ${JSON.stringify(response)}`);
      return response.data.data;
    } catch (error) {
      this.logger.error("Failed to build KyberSwap route", error);
      throw new BadRequestException("Failed to build KyberSwap route");
    }
  }

  private async makeHttpRequest<T>(method: "GET" | "POST", url: string, options: any): Promise<T> {
    const requestStartTime = Date.now();
    try {
      const response: AxiosResponse<T> =
        method === "GET"
          ? await firstValueFrom(this.httpService.get(url, options))
          : await firstValueFrom(this.httpService.post(url, options.data, options));

      if (response.status !== 200) {
        throw new BadRequestException(`API responded with status ${response.status}`);
      }

      return response.data;
    } finally {
      const duration = Date.now() - requestStartTime;
      this.logger.debug(`HTTP ${method} request to ${url} completed in ${duration}ms`);
    }
  }

  private constructResponse(
    arrakisResultUpdated: readonly [bigint, bigint, bigint],
    tokenInAmount: bigint,
    tokenInAddress: string,
    tokenOutAddress: string,
    kyberSwapResult: KyberSwapResponse,
    encodedRoute: string,
  ) {
    return {
      amount0: arrakisResultUpdated[0].toString(),
      amount1: arrakisResultUpdated[1].toString(),
      mintAmount: arrakisResultUpdated[2].toString(),
      swapAmount: tokenInAmount.toString(),
      swapFromToken: tokenInAddress,
      swapToToken: tokenOutAddress,
      kyberSwapRoute: kyberSwapResult.data.routeSummary,
      kyberSwapEncodedRoute: encodedRoute,
    };
  }

  private handleError(error: any, fallbackMessage: string): never {
    this.logger.error(error.message, error.stack);
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw new BadRequestException(fallbackMessage);
  }
}
