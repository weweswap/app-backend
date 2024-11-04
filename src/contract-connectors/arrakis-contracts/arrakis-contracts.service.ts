import { Injectable } from "@nestjs/common";
import { Memoize } from "typescript-memoize";
import { EvmConnectorService } from "../../blockchain-connectors/evm-connector/evm-connector.service";
import { Address, getContract, GetContractReturnType, PublicClient } from "viem";
import { arrakisHelperAbi, arrakisResolverAbi, arrakisVaultAbi } from "../../abis/abi";
import Big from "big.js";
import { CoingeckoService } from "../../price-oracles/coingecko/coingecko.service";
import { ONE_HOUR_IN_MILLISECONDS } from "../../shared/constants";
import { ArrakisVaultConfig } from "../../shared/class/WeweDataAggregatorConfig";
import { VaultHistoricalMetadataDto } from "../../shared/class/VaultHistoricalDataDto";
import { ITokenPair } from "../../shared/interface/ITokenPair";
import { WeweConfigService } from "../../config/wewe-data-aggregator-config.service";
import { Erc20Service } from "../erc-20/erc-20.service";
import { ArrakisResolverInput } from "../../shared/types/common";

/**
 * Service responsible for connecting to Arrakis Smart Contracts
 */
@Injectable()
export class ArrakisContractsService {
  constructor(
    private evmConnector: EvmConnectorService,
    private erc20Service: Erc20Service,
    private coingeckoService: CoingeckoService,
    private configService: WeweConfigService,
  ) {}

  public async getVaultHistoricalData(
    vault: ArrakisVaultConfig,
    timestampsInMs: number | bigint,
    blockNumber: number | bigint,
  ): Promise<VaultHistoricalMetadataDto> {
    const helperContract = this.getArrakisHelperContract();
    const vaultContract = this.getVaultContract(vault.address);

    // make all calls at once, whilst batching request (per blockNumber) to evm
    const [t0Price, t1Price, vaultTokenDecimals, tokenPair, [holding, totalSupply]] = await Promise.all([
      this.coingeckoService.getTokenUsdPrice(vault.token0CoingeckoName, Number(timestampsInMs)),
      this.coingeckoService.getTokenUsdPrice(vault.token1CoingeckoName, Number(timestampsInMs)),
      this.getVaultTokenDecimals(vault.address),
      this.getTokens(vault.address),
      this.evmConnector.client.multicall({
        blockNumber: BigInt(blockNumber),
        allowFailure: false,
        contracts: [
          {
            ...helperContract,
            functionName: "totalUnderlying",
            args: [vault.address],
          },
          {
            ...vaultContract,
            functionName: "totalSupply",
          },
        ],
        multicallAddress: this.configService.multicallV3Address,
      }),
    ]);

    const [holdings0, holdings1] = [
      Big(holding[0].toString()).div(Math.pow(10, tokenPair.token0.decimals)),
      Big(holding[1].toString()).div(Math.pow(10, tokenPair.token1.decimals)),
    ];

    const tvlUsd = holdings0
      .mul(Big(t0Price))
      .plus(holdings1.mul(Big(t1Price)))
      .toNumber();

    const vaultTokenPrecision = 10 ** vaultTokenDecimals;
    const vaultTokenSupply = Big(totalSupply.toString()).div(vaultTokenPrecision).toNumber();
    const vaultTokenPriceUsd = tvlUsd > 0 && vaultTokenSupply > 0 ? tvlUsd / vaultTokenSupply : 0;

    return new VaultHistoricalMetadataDto(vault.address.toLowerCase(), tvlUsd, vaultTokenPriceUsd, +t0Price, +t1Price);
  }

  @Memoize({
    expiring: ONE_HOUR_IN_MILLISECONDS,
    hashFunction: (v: ArrakisVaultConfig, t: number, b: number) => v.address + t + b,
  })
  public async getTvlUsd(
    vault: ArrakisVaultConfig,
    timestampsInMs: number | bigint,
    blockNumber: number | bigint,
  ): Promise<number> {
    const [[holdings0, holdings1], t0Price, t1Price] = await Promise.all([
      this.getUnderlyingTokenHoldings(vault, Number(blockNumber)),
      this.coingeckoService.getTokenUsdPrice(vault.token0CoingeckoName, Number(timestampsInMs)),
      this.coingeckoService.getTokenUsdPrice(vault.token1CoingeckoName, Number(timestampsInMs)),
    ]);

    return holdings0
      .mul(Big(t0Price))
      .plus(holdings1.mul(Big(t1Price)))
      .toNumber();
  }

  /**
   * Fetch underlying token holdings of arrakis vault
   * @param vault - Arrakis vault config
   * @param arrakisHelperAddress - Arrakis vault address
   * @param blockNumber - Block number to be queried for underlying token holdings
   * @return Normalised amounts of token0 and token1 (divided by their decimal precision)
   */
  @Memoize({
    expiring: ONE_HOUR_IN_MILLISECONDS,
    hashFunction: (v: ArrakisVaultConfig, b: number) => v.address + b,
  })
  public async getUnderlyingTokenHoldings(vault: ArrakisVaultConfig, blockNumber: number): Promise<[Big, Big]> {
    const helperContract = this.getArrakisHelperContract();
    const tokenPair: ITokenPair = await this.getTokens(vault.address);

    const holding = await helperContract.read.totalUnderlying([vault.address], {
      blockNumber: BigInt(blockNumber),
    });

    return [
      Big(holding[0].toString()).div(Math.pow(10, tokenPair.token0.decimals)),
      Big(holding[1].toString()).div(Math.pow(10, tokenPair.token1.decimals)),
    ];
  }

  /**
   * @description Fetch token0 and token1 assigned to the Arrakis Vault
   * @param vaultAddress - Arrakis Vault address
   */
  @Memoize()
  public async getTokens(vaultAddress: Address): Promise<ITokenPair> {
    const vaultContract = this.getVaultContract(vaultAddress);

    const [t0Address, t1Address] = await Promise.all([
      await vaultContract.read.token0(),
      await vaultContract.read.token1(),
    ]);

    return this.erc20Service.getErc20Tokens(t0Address, t1Address);
  }

  public async getMintAmounts(arrakisResolverInput: ArrakisResolverInput) {
    const resolverContract = this.getArrakisResolverContract();

    return await resolverContract.read.getMintAmounts([
      arrakisResolverInput.vault,
      arrakisResolverInput.amount0Max,
      arrakisResolverInput.amount1Max,
    ]);
  }

  @Memoize()
  private async getVaultTokenDecimals(vaultAddress: Address): Promise<number> {
    return this.getVaultContract(vaultAddress).read.decimals();
  }

  /**
   * Construct Arrakis Vault Viem Contract instance
   * @param vaultAddress - Arrakis Vault address
   * @private
   */
  @Memoize()
  private getVaultContract(vaultAddress: Address): GetContractReturnType<typeof arrakisVaultAbi, PublicClient> {
    return getContract({
      address: vaultAddress,
      abi: arrakisVaultAbi,
      client: this.evmConnector.client,
    });
  }

  /**
   * Construct Arrakis Helper Viem Contract instance
   * @param arrakisHelperAddress - Arrakis Helper address
   * @private
   */
  @Memoize()
  private getArrakisHelperContract(): GetContractReturnType<typeof arrakisHelperAbi, PublicClient> {
    return getContract({
      address: this.configService.arrakisHelperAddress,
      abi: arrakisHelperAbi,
      client: this.evmConnector.client,
    });
  }

  /**
   * Construct Arrakis Resolver Viem Contract instance
   * @param arrakisResolverAddress - Arrakis Resolver address
   * @private
   */
  @Memoize()
  private getArrakisResolverContract(): GetContractReturnType<typeof arrakisResolverAbi, PublicClient> {
    return getContract({
      address: this.configService.arrakisResolverAddress,
      abi: arrakisResolverAbi,
      client: this.evmConnector.client,
    });
  }
}
