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

@Injectable()
export class ZapInService {
  private readonly logger = new Logger(ZapInService.name);

  constructor(
    private configService: WeweConfigService,
    private arrakisContractsService: ArrakisContractsService,
    private coingeckoService: CoingeckoService,
    private readonly httpService: HttpService,
    private readonly erc20Service: Erc20Service,
  ) {}

  public async getZapInRoute(zapInRouteBodyDto: GetZapInRouteBodyDto) {
    try {
      const vaultAddress = zapInRouteBodyDto.vaultAddress as Address;

      // Fetch token names based on vault address
      const token0Name = this.configService.getArrakisVaultToken0CoingeckoId(vaultAddress);
      const token1Name = this.configService.getArrakisVaultToken1CoingeckoId(vaultAddress);

      // Fetch token details
      const tokens = await this.arrakisContractsService.getTokens(vaultAddress);

      let amount0Max: bigint, amount1Max: bigint;

      // Determine which token is input and set max amounts accordingly
      // totalSupply for the not provided token to provide a big enough number to make the provided value the limiting factor
      if (zapInRouteBodyDto.inputToken.toLowerCase() === token0Name.toLowerCase()) {
        amount0Max = BigInt(zapInRouteBodyDto.tokenInAmount);
        amount1Max = await this.erc20Service.getErc20TokenTotalSupply(tokens.token1.address);
      } else if (zapInRouteBodyDto.inputToken.toLowerCase() === token1Name.toLowerCase()) {
        amount1Max = BigInt(zapInRouteBodyDto.tokenInAmount);
        amount0Max = await this.erc20Service.getErc20TokenTotalSupply(tokens.token0.address);
      } else {
        throw new BadRequestException("Unsupported input token");
      }

      // Step 1: Call Arrakis Resolver for the ratio of the vault
      const arrakisResolverInput = {
        vault: vaultAddress,
        amount0Max,
        amount1Max,
      };
      this.logger.log(`Calling Arrakis Resolver with input:
        Vault Address: ${vaultAddress}
        Amount0Max: ${amount0Max.toString()}
        Amount1Max: ${amount1Max.toString()}
      `);

      const arrakisResult = await this.arrakisContractsService.getMintAmounts(arrakisResolverInput);
      this.logger.log(`Arrakis Resolver result:
        Token0 Amount: ${arrakisResult[0].toString()}
        Token1 Amount: ${arrakisResult[1].toString()}
        Shares: ${arrakisResult[2].toString()}
      `);
      const now = Date.now();

      // Step 2: Fetch token prices from Coingecko
      this.logger.log(`Fetching USD prices for tokens: ${token0Name} and ${token1Name} at timestamp ${now}`);
      const [token0Price, token1Price] = await Promise.all([
        this.coingeckoService.getTokenUsdPrice(token0Name, now),
        this.coingeckoService.getTokenUsdPrice(token1Name, now),
      ]);
      this.logger.log(`Fetched Prices - ${token0Name}: $${token0Price}, ${token1Name}: $${token1Price}`);

      // Step 3: Calculate USD values
      const formattedAmount0 = formatUnits(arrakisResult[0], tokens.token0.decimals);
      const formattedAmount1 = formatUnits(arrakisResult[1], tokens.token1.decimals);
      this.logger.log(`Formatted Amounts - ${token0Name}: ${formattedAmount0}, ${token1Name}: ${formattedAmount1}`);

      const token0UsdValue = +formattedAmount0 * +token0Price;
      const token1UsdValue = +formattedAmount1 * +token1Price;
      this.logger.log(`USD Values - ${token0Name}: $${token0UsdValue}, ${token1Name}: $${token1UsdValue}`);

      const totalUsdValue = token0UsdValue + token1UsdValue;
      this.logger.log(`Total USD Value: $${totalUsdValue}`);

      // Avoid division by zero
      if (totalUsdValue === 0) {
        this.logger.error("Total USD value is zero, cannot compute ratios");
        throw new BadRequestException("Total USD value is zero, cannot compute ratios");
      }
      const ratioToken0 = token0UsdValue / totalUsdValue;
      const ratioToken1 = token1UsdValue / totalUsdValue;
      this.logger.log(`Token Ratios - ${token0Name}: ${ratioToken0}, ${token1Name}: ${ratioToken1}`);

      let tokenInAddress: string, tokenOutAddress: string;
      let tokenInAmount: bigint;

      // Calculate swap amounts
      if (zapInRouteBodyDto.inputToken.toLowerCase() === token0Name.toLowerCase()) {
        // Swap token0 for token1
        const formattedAmount0Max = formatUnits(amount0Max, tokens.token0.decimals);
        const usdValueIn = Number(formattedAmount0Max) * +token0Price;
        this.logger.log(`Swapping ${token0Name} for ${token1Name}`);
        this.logger.log(`USD Value In: $${usdValueIn}`);

        const calculatedTokenInAmount = ((usdValueIn * ratioToken1) / +token0Price) * 10 ** tokens.token0.decimals;
        tokenInAmount = BigInt(Math.ceil(calculatedTokenInAmount));
        amount0Max = amount0Max - tokenInAmount;
        amount1Max = 0n;
        this.logger.log(`Calculated Token In Amount (raw): ${calculatedTokenInAmount}`);
        this.logger.log(`Final Token In Amount: ${tokenInAmount.toString()}`);

        tokenInAddress = tokens.token0.address;
        tokenOutAddress = tokens.token1.address;
        this.logger.log(`Token Addresses - In: ${tokenInAddress}, Out: ${tokenOutAddress}`);
      } else {
        // Swap token1 for token0
        const formattedAmount1Max = formatUnits(amount1Max, tokens.token1.decimals);
        const usdValueIn = Number(formattedAmount1Max) * +token1Price;
        this.logger.log(`Swapping ${token1Name} for ${token0Name}`);
        this.logger.log(`USD Value In: $${usdValueIn}`);

        const calculatedTokenInAmount = ((usdValueIn * ratioToken0) / +token1Price) * 10 ** tokens.token1.decimals;
        tokenInAmount = BigInt(Math.ceil(calculatedTokenInAmount));
        amount1Max = amount1Max - tokenInAmount;
        amount0Max = 0n;
        this.logger.log(`Calculated Token In Amount (raw): ${calculatedTokenInAmount}`);
        this.logger.log(`Final Token In Amount: ${tokenInAmount.toString()}`);

        tokenInAddress = tokens.token1.address;
        tokenOutAddress = tokens.token0.address;
        this.logger.log(`Token Addresses - In: ${tokenInAddress}, Out: ${tokenOutAddress}`);
      }

      this.logger.log(`Preparing to swap:
        Token In Address: ${tokenInAddress}
        Token Out Address: ${tokenOutAddress}
        Token In Amount: ${tokenInAmount.toString()}
      `);

      // Step 4: Call KyberSwap API
      const kyberSwapApiUrl = "https://aggregator-api.kyberswap.com/base/api/v1/routes";
      const amountIn = tokenInAmount.toString();

      const kyberSwapParams = {
        tokenIn: tokenInAddress,
        tokenOut: tokenOutAddress,
        amountIn: amountIn,
      };

      let requestStartTime = Date.now();
      this.logger.log(`Calling KyberSwap API with params: ${JSON.stringify(kyberSwapParams)}`);

      let response: AxiosResponse;
      try {
        response = await firstValueFrom(
          this.httpService.get(kyberSwapApiUrl, {
            params: kyberSwapParams,
            "axios-retry": {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              onRetry: (retryCount, error, requestConfig) => {
                console.log(`Retrying Kyberswap route request attempt ${retryCount}`);
              },
            },
          }),
        );
      } finally {
        const requestEndTime = Date.now();
        const duration = requestEndTime - requestStartTime;
        this.logger.debug(`GET request to ${kyberSwapApiUrl} completed in ${duration}ms`);
      }

      if (response.status !== 200) {
        this.logger.error(`KyberSwap API responded with status ${response.status}`);
        throw new BadRequestException("Failed to fetch swap route from KyberSwap");
      }

      const kyberSwapResult: KyberSwapResponse = response.data;

      this.logger.log(`KyberSwap API result: ${JSON.stringify(kyberSwapResult)}`);

      // Step 5: Call Arrakis Resolver once more to get final amounts and shares
      if (amount0Max === 0n) {
        amount0Max = BigInt(kyberSwapResult.data.routeSummary.amountOut);
      } else {
        amount1Max = BigInt(kyberSwapResult.data.routeSummary.amountOut);
      }
      const arrakisResolverInputUpdated = {
        vault: vaultAddress,
        amount0Max,
        amount1Max,
      };
      this.logger.log(`Calling Arrakis Resolver with input:
                Vault Address: ${vaultAddress}
                Amount0Max: ${amount0Max.toString()}
                Amount1Max: ${amount1Max.toString()}
              `);

      const arrakisResultUpdated = await this.arrakisContractsService.getMintAmounts(arrakisResolverInputUpdated);
      this.logger.log(`Updated Arrakis Resolver result:
                Token0 Amount: ${arrakisResultUpdated[0].toString()}
                Token1 Amount: ${arrakisResultUpdated[1].toString()}
                Shares: ${arrakisResultUpdated[2].toString()}
              `);

      // Step 6: Build Kyberswap Route
      // Extract required parameters from the response and request body or configuration
      const chain = "base";
      const sender = "0x9377daBe42574cFB0BA202ed1A3a133C68fA1Bfd"; // TODO: get from config
      const recipient = sender; // Default to sender if not provided
      const slippageTolerance = 500; // Default 5%

      // Prepare the request body
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
        sender: sender,
        recipient: recipient,
        slippageTolerance: slippageTolerance,
      };

      this.logger.log(`Building KyberSwap Route with body: ${JSON.stringify(buildRouteBody)}`);

      // Construct the build URL with the chain path parameter
      const buildRouteUrl = `https://aggregator-api.kyberswap.com/${chain}/api/v1/route/build`;

      requestStartTime = Date.now();
      this.logger.log(`Sending POST request to ${buildRouteUrl} with body: ${JSON.stringify(buildRouteBody)}`);

      let buildRouteResponse: AxiosResponse;
      try {
        // Make the POST request to build the route
        buildRouteResponse = await firstValueFrom(
          this.httpService.post(buildRouteUrl, buildRouteBody, {
            headers: {
              "Content-Type": "application/json",
              //"x-client-id": this.configService.getKyberSwapClientId(), // Might be needed for production use?
            },
            "axios-retry": {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              onRetry: (retryCount, error, requestConfig) => {
                console.log(`Retrying Kyberswap build request attempt ${retryCount}`);
              },
            },
          }),
        );
      } finally {
        const requestEndTime = Date.now();
        const duration = requestEndTime - requestStartTime;
        this.logger.debug(`POST request to ${buildRouteUrl} completed in ${duration}ms`);
      }

      if (buildRouteResponse.status !== 200) {
        this.logger.error(`KyberSwap Route Build API responded with status ${buildRouteResponse.status}`);
        throw new BadRequestException("Failed to build KyberSwap route");
      }

      const buildRouteResult = buildRouteResponse.data;

      if (buildRouteResult.code !== 0) {
        this.logger.error(`KyberSwap Route Build API error: ${buildRouteResult.message}`);
        throw new BadRequestException(`KyberSwap Route Build API error: ${buildRouteResult.message}`);
      }

      this.logger.log(`KyberSwap Route Build result: ${JSON.stringify(buildRouteResult)}`);

      const encodedRoute = buildRouteResult.data.data;

      return {
        amount0: arrakisResultUpdated[0].toString(),
        amount1: arrakisResultUpdated[1].toString(),
        mintAmount: arrakisResultUpdated[2].toString(),
        swapAmount: tokenInAmount.toString(),
        swapFromToken: tokenInAddress,
        swapToToken: tokenOutAddress,
        kyberSwapRoute: routeSummary,
        kyberSwapEncodedRoute: encodedRoute,
      };
    } catch (error) {
      this.logger.error(`Error in getZapInRoute: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Failed to get Zap In route");
    }
  }
}
