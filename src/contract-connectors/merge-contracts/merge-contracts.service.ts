import { Injectable } from "@nestjs/common";
import { Memoize } from "typescript-memoize";
import { EvmConnectorService } from "../../blockchain-connectors/evm-connector/evm-connector.service";
import { Address, getContract, GetContractReturnType, PublicClient } from "viem";
import { mergeContractAbi } from "../../abis/abi";
import { Erc20Service } from "../erc-20/erc-20.service";
import { Token } from "../../shared/types/common";

/**
 * Service responsible for connecting to Merge Smart Contracts
 */
@Injectable()
export class MergeContractsService {
  constructor(
    private evmConnector: EvmConnectorService,
    private erc20Service: Erc20Service,
  ) {}

  /**
   * @description Fetch merge token assigned to the Merge Contract
   * @param vaultAddress - Arrakis Vault address
   */
  @Memoize()
  public async getTokens(mergeContractAddress: Address): Promise<Token> {
    const mergeContract = this.getMergeContract(mergeContractAddress);

    const mergeTokenAddress = await mergeContract.read.getToken();
    const chain = await this.evmConnector.getChain();

    return this.erc20Service.getErc20Token(mergeTokenAddress, chain.name);
  }

  /**
   * Construct Merge Contract Viem Contract instance
   * @param mergeContractAddress - Merge contract address
   * @private
   */
  @Memoize()
  private getMergeContract(
    mergeContractAddress: Address,
  ): GetContractReturnType<typeof mergeContractAbi, PublicClient> {
    return getContract({
      address: mergeContractAddress,
      abi: mergeContractAbi,
      client: this.evmConnector.client,
    });
  }
}
