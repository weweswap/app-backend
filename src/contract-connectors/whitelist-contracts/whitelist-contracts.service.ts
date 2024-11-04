// src/blockchain-connectors/whitelist-contracts/whitelist-contracts.service.ts

import { Injectable, Logger, InternalServerErrorException } from "@nestjs/common";
import { getContract, Address } from "viem";
import { MemoizeExpiring } from "typescript-memoize";
import { ONE_HOUR_IN_MILLISECONDS } from "../../shared/constants";
import { EvmConnectorService } from "../../blockchain-connectors/evm-connector/evm-connector.service";
import { EvmWriteService } from "../../blockchain-connectors/evm-write/evm-write.service";
import { whitelistAbi } from "../../abis/abi";

//TODO remove - not needed anymore
@Injectable()
export class WhitelistContractsService {
  private readonly logger = new Logger(WhitelistContractsService.name);
  private readonly contractAddress: Address;

  constructor(
    private readonly evmConnectorService: EvmConnectorService,
    private readonly evmWriteService: EvmWriteService,
  ) {
    //TODO: move address to config
    const address = "0x711Aadc66281E42Ecc7f6f4b91d47F4aB792AF5f";
    if (!address) {
      this.logger.error("WHITELIST_CONTRACT_ADDRESS is not defined");
      throw new InternalServerErrorException("Whitelist contract address not configured");
    }
    this.contractAddress = address as Address;
  }

  /**
   * Check if an address is whitelisted.
   */
  @MemoizeExpiring(ONE_HOUR_IN_MILLISECONDS)
  public async isWhitelisted(address: Address): Promise<boolean> {
    try {
      const contract = getContract({
        address: this.contractAddress,
        abi: whitelistAbi,
        client: this.evmConnectorService.client,
      });
      const result = await contract.read.whiteList([address]);
      return result;
    } catch (error) {
      this.logger.error(`Error checking whitelist status for ${address}: ${error.message}`);
      throw new InternalServerErrorException("Failed to verify whitelist status");
    }
  }

  /**
   * Add an address to the whitelist.
   */
  public async addToWhitelist(address: Address): Promise<string> {
    try {
      const contract = getContract({
        address: this.contractAddress,
        abi: whitelistAbi,
        client: this.evmWriteService.walletClient,
      });

      const txHash = await contract.write.addWhiteList([address, true]);
      return txHash;
    } catch (error) {
      this.logger.error(`Error adding ${address} to whitelist: ${error.message}`);
      throw new InternalServerErrorException("Failed to add address to whitelist");
    }
  }
}
