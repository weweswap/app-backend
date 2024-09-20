import { Injectable, Logger } from "@nestjs/common";
import { BlockNumber, Chain, createPublicClient, extractChain, http, PublicClient, TransactionReceipt } from "viem";
import { Memoize, MemoizeExpiring } from "typescript-memoize";
import { Hash } from "viem/types/misc";
import { ChainId, KnownChainId } from "../../shared/types/chainsIds";
import * as chains from "viem/chains";
import { isOlderThanTenMinutes } from "../../utils/aggregation-utils";
import { FIFTY_MINUTES_IN_MILLISECONDS } from "../../shared/constants";
import Web3 from "web3";
import EthDater from "ethereum-block-by-date";
import { WeweConfigService } from "../../config/wewe-data-aggregator-config.service";

@Injectable()
export class EvmConnectorService {
  public readonly web3Client: Web3;
  public readonly client: PublicClient;
  private chain?: Chain;
  private dater: EthDater;

  constructor(
    private readonly logger: Logger,
    private readonly configService: WeweConfigService,
  ) {
    this.client = createPublicClient({ transport: http(this.configService.nodeUrlRpc) });
    this.web3Client = new Web3(this.configService.nodeUrlRpc);
    this.dater = new EthDater(this.web3Client);
  }

  /**
   * Should be called when constructing this service as provider (useFactory in module)
   */
  public async initialize(): Promise<EvmConnectorService> {
    this.logger.debug("Initializing EvmConnectorService..", EvmConnectorService.name);
    this.chain = await this.getChain();
    this.logger.debug(
      `EvmConnectorService connected to: ${this.chain.name}, with id: ${this.chain.id}`,
      this.initialize.name,
    );
    return this;
  }

  @Memoize()
  public async getBlockTimestamp(blocknumber: BlockNumber): Promise<bigint> {
    const block = await this.client.getBlock({
      blockNumber: blocknumber,
    });

    return block.timestamp * 1000n; // return in millis
  }

  @MemoizeExpiring(FIFTY_MINUTES_IN_MILLISECONDS)
  public async getClosestBlocknumber(timestamp: number): Promise<number> {
    let blockNumber: number;

    if (isOlderThanTenMinutes(Number(timestamp))) {
      blockNumber = (await this.dater.getDate(timestamp)).block;
    } else {
      blockNumber = Number(await this.getCurrentBlockNumber()) - 1;
    }
    return blockNumber;
  }

  public async getCurrentBlockNumber(): Promise<bigint> {
    return this.client.getBlockNumber();
  }

  @Memoize()
  public async getTxReceipt(txHash: Hash): Promise<TransactionReceipt | null> {
    return await this.client.getTransactionReceipt({
      hash: txHash,
    });
  }

  @Memoize()
  public async getChainId(): Promise<ChainId> {
    if (this.chain) {
      return this.chain.id;
    }
    return await this.client.getChainId();
  }

  @Memoize()
  public async getNetwork(): Promise<string> {
    if (this.chain) {
      return this.chain.name;
    }
    return (await this.client.getChainId()).toString();
  }

  @Memoize()
  private async getChain(): Promise<Chain> {
    if (this.chain) {
      return this.chain;
    }
    const chainId = await this.getChainId();

    try {
      this.chain = extractChain({
        chains: Object.values(chains),
        id: chainId as KnownChainId,
      });
      return this.chain;
    } catch (error) {
      this.logger.warn(`Chain with id ${chainId} not recognized by viem. Creating custom chain.`);

      // Create a custom chain object
      this.chain = {
        id: chainId,
        name: `Custom Chain ${chainId}`,
        nativeCurrency: { name: "Native Token", symbol: "TOKEN", decimals: 18 },
        rpcUrls: { default: { http: [this.configService.nodeUrlRpc] } },
      };
      return this.chain;
    }
  }
}
