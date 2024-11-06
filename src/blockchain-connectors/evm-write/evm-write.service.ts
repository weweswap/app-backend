import { Injectable, Logger } from "@nestjs/common";
import { createWalletClient, extractChain, http, HttpTransport, PrivateKeyAccount, WalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { WeweConfigService } from "../../config/wewe-data-aggregator-config.service";
import { Chain } from "viem/chains";
import { Memoize } from "typescript-memoize";
import { ChainId, KnownChainId } from "../../shared/types/chainsIds";
import * as chains from "viem/chains";

@Injectable()
export class EvmWriteService {
  private readonly logger = new Logger(EvmWriteService.name);
  public readonly walletClient: WalletClient<HttpTransport, Chain, PrivateKeyAccount>;
  private chain?: Chain;

  constructor(private readonly configService: WeweConfigService) {
    this.walletClient = createWalletClient({
      account: privateKeyToAccount(this.configService.privateKey),
      transport: http(this.configService.nodeUrlRpc),
    });
  }

  /**
   * Should be called when constructing this service as provider (useFactory in module)
   */
  public async initialize(): Promise<EvmWriteService> {
    this.logger.debug("Initializing EvmWriteService..", EvmWriteService.name);
    this.chain = await this.getChain();
    this.logger.debug(
      `EvmWriteService connected to: ${this.chain.name}, with id: ${this.chain.id}`,
      this.initialize.name,
    );
    return this;
  }

  @Memoize()
  public async getChainId(): Promise<ChainId> {
    if (this.chain) {
      return this.chain.id;
    }
    return await this.walletClient.getChainId();
  }

  @Memoize()
  public async getNetwork(): Promise<string> {
    if (this.chain) {
      return this.chain.name;
    }
    return (await this.walletClient.getChainId()).toString();
  }

  @Memoize()
  public async getChain(): Promise<Chain> {
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
