import { Injectable, Logger } from "@nestjs/common";
import { Address, getContract } from "viem";
import { ArrakisUnderlyingAmounts, ranges } from "../../../shared/types/common";
import { EvmConnectorService } from "../../../blockchain-connectors/evm-connector/evm-connector.service";
import { arrakisHelperAbi } from "../../../abis/abi";
import { WeweConfigService } from "../../../config/wewe-data-aggregator-config.service";

@Injectable()
export class ArrakisHelperService {
  private arrakisHelperAddress;
  private archiveArrakisHelperContract;

  constructor(
    private readonly logger: Logger,
    private readonly archiveEvmConnector: EvmConnectorService,
    private readonly configService: WeweConfigService,
  ) {
    this.arrakisHelperAddress = this.configService.arrakisHelperAddress;
    this.archiveArrakisHelperContract = getContract({
      address: this.arrakisHelperAddress,
      abi: arrakisHelperAbi,
      client: this.archiveEvmConnector.client,
    });

    this.logger.debug(
      `Arrakis Helper Service initialized with helper address: ${this.arrakisHelperAddress}`,
      ArrakisHelperService.name,
    );
  }

  public async getAllUnderlyingTokenHoldings(
    vaultAddress: Address,
    blocknumber?: number,
  ): Promise<ArrakisUnderlyingAmounts> {
    if (blocknumber) {
      const underlyingTokens = await this.archiveArrakisHelperContract.read.totalUnderlyingWithFeesAndLeftOver(
        [vaultAddress],
        { blockNumber: BigInt(blocknumber) },
      );
      return underlyingTokens;
    }

    const underlyingTokens = await this.archiveArrakisHelperContract.read.totalUnderlyingWithFeesAndLeftOver([
      vaultAddress,
    ]);
    return underlyingTokens;
  }

  public async getToken0AndToken1ByRange(
    ranges: ranges,
    token0Address: Address,
    token1Address: Address,
    vaultAddress: Address,
  ) {
    const tokenByRangeResult = await this.archiveArrakisHelperContract.read.token0AndToken1ByRange([
      ranges,
      token0Address,
      token1Address,
      vaultAddress,
    ]);
    return tokenByRangeResult;
  }
}
