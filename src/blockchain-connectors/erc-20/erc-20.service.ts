import { Injectable, Logger } from "@nestjs/common";
import { Address, getContract, GetContractReturnType, PublicClient } from "viem";
import { erc20Abi } from "viem";
import { Memoize } from "typescript-memoize";
import { Token } from "../../shared/types/common";
import { NATIVE_TOKEN_CONTRACT_ADDRESS } from "../../shared/constants";
import { EvmConnectorService } from "../evm-connector/evm-connector.service";
import { ITokenPair } from "../../shared/interface/ITokenPair";
import { BrokkrDataAggregatorConfigService } from "../../config/brokkr-data-aggregator-config.service";

@Injectable()
export class Erc20Service {
  constructor(
    private readonly logger: Logger,
    private readonly evmConnector: EvmConnectorService,
    private configService: BrokkrDataAggregatorConfigService,
  ) {}

  @Memoize()
  public async getTokenSymbol(tokenAddress: Address): Promise<string> {
    const contract = getContract({
      address: tokenAddress,
      abi: erc20Abi,
      client: this.evmConnector.client,
    });

    return contract.read.symbol();
  }

  /**
   * @description Fetch token0 and token1 assigned to the Arrakis Vault
   * @param t0Address
   * @param t1Address
   */
  @Memoize({
    hashFunction: (t0Address, t1Address) => t0Address + t1Address,
  })
  public async getErc20Tokens(t0Address: Address, t1Address: Address): Promise<ITokenPair> {
    const [t0Symbol, t1Symbol, t0Decimals, t1Decimals] = await this.evmConnector.client.multicall({
      allowFailure: false,
      contracts: [
        {
          ...this.getErc20Contract(t0Address),
          functionName: "symbol",
        },
        {
          ...this.getErc20Contract(t1Address),
          functionName: "symbol",
        },
        {
          ...this.getErc20Contract(t0Address),
          functionName: "decimals",
        },
        {
          ...this.getErc20Contract(t1Address),
          functionName: "decimals",
        },
      ],
      multicallAddress: this.configService.multicallV3Address,
    });

    return {
      token0: { address: t0Address, ticker: t0Symbol, decimals: t0Decimals },
      token1: { address: t1Address, ticker: t1Symbol, decimals: t1Decimals },
    };
  }

  @Memoize()
  public async getErc20TokenDecimals(tokenAddress: Address): Promise<number> {
    // handle native token
    if (tokenAddress == NATIVE_TOKEN_CONTRACT_ADDRESS) {
      return 18;
    }

    try {
      const contract = getContract({
        address: tokenAddress,
        abi: erc20Abi,
        client: this.evmConnector.client,
      });

      return contract.read.decimals();
    } catch (e: unknown) {
      this.logger.error(`Can't get decimals for a token ${tokenAddress}`);
      throw new Error(`Can't get decimals for a token ${tokenAddress}`);
    }
  }

  public async getErc20TokenTotalSupply(tokenAddress: Address): Promise<bigint | undefined> {
    try {
      const contract = getContract({
        address: tokenAddress,
        abi: erc20Abi,
        client: this.evmConnector.client,
      });

      return contract.read.totalSupply();
    } catch (e: unknown) {
      this.logger.error(`Can't get total supply for a token ${tokenAddress}`);
      return undefined;
    }
  }

  public async getErc20TokenBalanceOf(tokenAddress: Address, userAddress: Address): Promise<bigint | undefined> {
    try {
      const contract = getContract({
        address: tokenAddress,
        abi: erc20Abi,
        client: this.evmConnector.client,
      });

      return contract.read.balanceOf([userAddress]);
    } catch (e: unknown) {
      this.logger.error(`Can't get balance of token ${tokenAddress} for user ${userAddress}`);
      return undefined;
    }
  }

  @Memoize((address: Address, chain: string) => `${address.toString()}-${chain}`)
  public async getErc20Token(address: Address, chain: string): Promise<Token> {
    const ticker = await this.getTokenSymbol(address);
    const decimals = await this.getErc20TokenDecimals(address);

    return {
      address: address.toString(),
      ticker: ticker,
      chain: chain,
      decimals: decimals.toString(),
      presentationDecimals: decimals.toString(),
    };
  }

  @Memoize()
  public getErc20Contract(tokenAddress: Address): GetContractReturnType<typeof erc20Abi, PublicClient> {
    return getContract({
      address: tokenAddress,
      abi: erc20Abi,
      client: this.evmConnector.client,
    });
  }
}
