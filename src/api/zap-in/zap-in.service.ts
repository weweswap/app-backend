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
import { KyberswapConfig } from "../../shared/class/KyberswapConfig";

interface TokenWithCoingecko extends IToken {
  coinGeckoId: string; // e.g., "ethereum", "dai"
}

interface TokenInfo {
  token0CoingeckoId: string;
  token1CoingeckoId: string;
}

interface TokenAmounts {
  amount0Max: bigint;
  amount1Max: bigint;
  inputToken: TokenWithCoingecko;
  outputToken: TokenWithCoingecko;
}

@Injectable()
export class ZapInService {
  private readonly logger = new Logger(ZapInService.name);
  private readonly kyberswapConfig: KyberswapConfig;

  constructor(
    private readonly configService: WeweConfigService,
    private readonly arrakisContractsService: ArrakisContractsService,
    private readonly coingeckoService: CoingeckoService,
    private readonly httpService: HttpService,
    private readonly erc20Service: Erc20Service,
  ) {
    this.kyberswapConfig = this.configService.kyberswapConfig;
  }

  public async getZapInRoute(zapInRouteBodyDto: GetZapInRouteBodyDto) {
    try {
      const vaultAddress = zapInRouteBodyDto.vaultAddress as Address;

      const [tokenInfo, tokens] = await Promise.all([
        this.fetchTokenInfo(vaultAddress),
        this.arrakisContractsService.getTokens(vaultAddress),
      ]).catch((error) => {
        this.logger.error(`Failed to fetch initial token data: ${error.message}`);
        throw new BadRequestException("Failed to fetch token information");
      });

      const tokensWithCoingecko = this.combineTokenInfo(tokens, tokenInfo);
      await this.validateInput(zapInRouteBodyDto, tokensWithCoingecko);

      const amounts = await this.determineTokenAmounts(zapInRouteBodyDto, tokensWithCoingecko);

      return await this.processZapInRoute(vaultAddress, amounts, tokensWithCoingecko);
    } catch (error) {
      this.handleError(error, "Failed to get Zap In route");
    }
  }

  private async validateInput(
    dto: GetZapInRouteBodyDto,
    tokens: ITokenPair & {
      token0: TokenWithCoingecko;
      token1: TokenWithCoingecko;
    },
  ): Promise<void> {
    if (dto.inputToken !== tokens.token0.coinGeckoId && dto.inputToken !== tokens.token1.coinGeckoId) {
      throw new BadRequestException("Invalid input token or vault address - does not match token0 or token1");
    }

    if (BigInt(dto.tokenInAmount) <= 0n) {
      throw new BadRequestException("Token amount must be greater than 0");
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
    const formattedAmount0 = parseFloat(formattedAmount0Str);
    this.logger.debug(`Parsed Amount0: ${formattedAmount0}`);

    // Format and parse amount1
    const formattedAmount1Str = formatUnits(arrakisResult[1], tokens.token1.decimals);
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
    const kyberSwapApiUrl = `${this.kyberswapConfig.url}/base/api/v1/routes`;
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
    this.logger.debug(`Initial amount0Max: ${amount0Max.toString()}, amount1Max: ${amount1Max.toString()}`);

    // Extract the amountOut from KyberSwap result
    const amountOutStr = kyberSwapResult.data.routeSummary.amountOut;
    const amountOutTokenAddress = kyberSwapResult.data.routeSummary.tokenOut;
    this.logger.debug(`KyberSwap amountOut: ${amountOutStr}`);
    const updatedAmountOut = BigInt(amountOutStr);

    // Determine which amount to update
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

    const input = {
      vault,
      amount0Max: updatedAmount0Max,
      amount1Max: updatedAmount1Max,
    };

    this.logger.debug(
      `Calling getMintAmounts with input: { vault: ${input.vault}, amount0Max: ${input.amount0Max.toString()}, amount1Max: ${input.amount1Max.toString()} }`,
    );

    // Fetch updated mint amounts
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

  private async buildKyberSwapRoute(kyberSwapResult: KyberSwapResponse): Promise<string> {
    const buildRouteUrl = `${this.kyberswapConfig.url}/${this.kyberswapConfig.chain}/api/v1/route/build`;
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
      sender: this.kyberswapConfig.senderAddress,
      recipient: this.kyberswapConfig.recipientAddress,
      slippageTolerance: this.kyberswapConfig.slippageTolerance,
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
        throw new BadRequestException(`API responded with status ${response.status}`);
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
    throw new BadRequestException(errorMessage);
  }

  private async processZapInRoute(
    vaultAddress: Address,
    amounts: TokenAmounts,
    tokens: ITokenPair & { token0: TokenWithCoingecko; token1: TokenWithCoingecko },
  ) {
    const arrakisResult = await this.fetchArrakisMintAmounts(vaultAddress, amounts.amount0Max, amounts.amount1Max);

    const [token0Price, token1Price] = await this.fetchTokenPrices(tokens.token0, tokens.token1);

    const ratios = this.calculateRatio(arrakisResult, tokens, +token0Price, +token1Price);

    const swapAmounts = this.calculateSwapAmounts(
      amounts.inputToken,
      amounts.outputToken,
      tokens,
      ratios.ratioToken0,
      ratios.ratioToken1,
      +token0Price,
      +token1Price,
      amounts.amount0Max,
      amounts.amount1Max,
    );

    const kyberSwapResult = await this.fetchKyberSwapRoute(
      swapAmounts.tokenInAddress,
      swapAmounts.tokenOutAddress,
      swapAmounts.tokenInAmount,
    );

    // Validate kyberSwapResult
    this.validateKyberSwapResult(kyberSwapResult);

    const arrakisResultUpdated = await this.updateArrakisMintAmounts(
      vaultAddress,
      amounts.amount0Max,
      amounts.amount1Max,
      kyberSwapResult,
      tokens,
    );

    const encodedRoute = await this.buildKyberSwapRoute(kyberSwapResult);

    return this.constructResponse(
      arrakisResultUpdated,
      swapAmounts.tokenInAmount,
      swapAmounts.tokenInAddress,
      swapAmounts.tokenOutAddress,
      kyberSwapResult,
      encodedRoute,
    );
  }

  private validateKyberSwapResult(result: KyberSwapResponse): void {
    if (!result?.data?.routeSummary) {
      throw new BadRequestException("Invalid KyberSwap response format");
    }

    const { amountIn, amountOut, tokenIn, tokenOut } = result.data.routeSummary;

    if (!amountIn || !amountOut || !tokenIn || !tokenOut) {
      throw new BadRequestException("Missing required fields in KyberSwap response");
    }

    if (BigInt(amountOut) <= 0n) {
      throw new BadRequestException("Invalid amount out from KyberSwap");
    }
  }

  private async fetchTokenInfo(vaultAddress: Address): Promise<TokenInfo> {
    try {
      const [token0CoingeckoId, token1CoingeckoId] = await Promise.all([
        this.configService.getArrakisVaultToken0CoingeckoId(vaultAddress),
        this.configService.getArrakisVaultToken1CoingeckoId(vaultAddress),
      ]);

      if (!token0CoingeckoId || !token1CoingeckoId) {
        this.logger.error(`Missing Coingecko IDs for vault ${vaultAddress}`);
        throw new BadRequestException("Missing token identifiers");
      }

      return {
        token0CoingeckoId,
        token1CoingeckoId,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch token info for vault ${vaultAddress}: ${error.message}`, error.stack);
      throw new BadRequestException("Failed to fetch token information");
    }
  }

  private combineTokenInfo(
    tokens: ITokenPair,
    tokenInfo: TokenInfo,
  ): ITokenPair & {
    token0: TokenWithCoingecko;
    token1: TokenWithCoingecko;
  } {
    try {
      this.validateTokenAddresses(tokens);

      return {
        token0: {
          ...tokens.token0,
          coinGeckoId: tokenInfo.token0CoingeckoId,
        },
        token1: {
          ...tokens.token1,
          coinGeckoId: tokenInfo.token1CoingeckoId,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to combine token info: ${error.message}`);
      throw new BadRequestException("Failed to process token information");
    }
  }

  private validateTokenAddresses(tokens: ITokenPair): void {
    if (!tokens.token0?.address || !tokens.token1?.address) {
      throw new BadRequestException("Invalid token addresses");
    }

    if (!tokens.token0?.decimals || !tokens.token1?.decimals) {
      throw new BadRequestException("Missing token decimals");
    }
  }

  private async determineTokenAmounts(
    dto: GetZapInRouteBodyDto,
    tokens: ITokenPair & {
      token0: TokenWithCoingecko;
      token1: TokenWithCoingecko;
    },
  ): Promise<TokenAmounts> {
    try {
      await this.validateTokenAmountInput(dto);

      const inputTokenLower = dto.inputToken.toLowerCase();
      const token0Lower = tokens.token0.coinGeckoId.toLowerCase();
      const token1Lower = tokens.token1.coinGeckoId.toLowerCase();

      // Validate token matching
      if (inputTokenLower !== token0Lower && inputTokenLower !== token1Lower) {
        throw new BadRequestException(`Input token ${dto.inputToken} does not match either vault token`);
      }

      return await this.calculateTokenAmounts(dto, tokens, inputTokenLower === token0Lower);
    } catch (error) {
      this.logger.error(`Failed to determine token amounts: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to determine token amounts: ${error.message}`);
    }
  }

  private async validateTokenAmountInput(dto: GetZapInRouteBodyDto): Promise<void> {
    if (!dto.tokenInAmount) {
      throw new BadRequestException("Missing token input amount");
    }

    try {
      const amount = BigInt(dto.tokenInAmount);
      if (amount <= 0n) {
        throw new BadRequestException("Token amount must be greater than 0");
      }
    } catch (error) {
      throw new BadRequestException("Invalid token amount format");
    }
  }

  private async calculateTokenAmounts(
    dto: GetZapInRouteBodyDto,
    tokens: ITokenPair & {
      token0: TokenWithCoingecko;
      token1: TokenWithCoingecko;
    },
    isToken0Input: boolean,
  ): Promise<TokenAmounts> {
    try {
      if (isToken0Input) {
        const amount0Max = BigInt(dto.tokenInAmount);
        const amount1Max = await this.fetchMaxAmount(tokens.token1.address);

        return {
          amount0Max,
          amount1Max,
          inputToken: tokens.token0,
          outputToken: tokens.token1,
        };
      } else {
        const amount1Max = BigInt(dto.tokenInAmount);
        const amount0Max = await this.fetchMaxAmount(tokens.token0.address);

        return {
          amount0Max,
          amount1Max,
          inputToken: tokens.token1,
          outputToken: tokens.token0,
        };
      }
    } catch (error) {
      this.logger.error(`Failed to calculate token amounts: ${error.message}`, error.stack);
      throw new BadRequestException("Failed to calculate token amounts");
    }
  }

  private async fetchMaxAmount(tokenAddress: Address): Promise<bigint> {
    try {
      const totalSupply = await this.erc20Service.getErc20TokenTotalSupply(tokenAddress);

      if (!totalSupply || totalSupply === 0n) {
        throw new Error(`Invalid total supply for token ${tokenAddress}`);
      }

      return totalSupply;
    } catch (error) {
      this.logger.error(`Failed to fetch max amount for token ${tokenAddress}: ${error.message}`);
      throw new BadRequestException(`Failed to fetch token supply for ${tokenAddress}`);
    }
  }
}
