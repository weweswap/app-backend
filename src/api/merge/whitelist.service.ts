import { Injectable, Logger, NotFoundException, BadRequestException } from "@nestjs/common";
import { WhitelistContractsService } from "../../contract-connectors/whitelist-contracts/whitelist-contracts.service";
import { Address } from "viem";

@Injectable()
export class WhitelistService {
  private readonly logger = new Logger(WhitelistService.name);

  // Example local whitelist; consider moving to a database or configuration if dynamic
  private readonly localWhitelist = [
    { address: "0x0000000000000000000000000000000000000000" },
    // Add more addresses as needed
  ];

  constructor(private readonly whitelistContractsService: WhitelistContractsService) {}

  /**
   * Adds an address to the whitelist after validation.
   */
  public async addAddressToWhitelist(address: string): Promise<string> {
    // Check if address exists in the local whitelist
    const isLocallyWhitelisted = this.localWhitelist.some(
      (item) => item.address.toLowerCase() === address.toLowerCase(),
    );

    if (!isLocallyWhitelisted) {
      this.logger.warn(`Address not found in local whitelist: ${address}`);
      throw new NotFoundException("Address not found in the whitelist");
    }

    try {
      // Check if the address is already whitelisted on the blockchain
      const alreadyWhitelisted = await this.whitelistContractsService.isWhitelisted(address as Address);
      if (alreadyWhitelisted) {
        this.logger.log(`Address is already whitelisted: ${address}`);
        return "Address is already whitelisted";
      }

      // Add the address to the blockchain whitelist
      const txHash = await this.whitelistContractsService.addToWhitelist(address as Address);
      this.logger.log(`Whitelist transaction sent for ${address}: ${txHash}`);
      return txHash;
    } catch (error) {
      this.logger.error(`Failed to add address to whitelist: ${address}`, error.stack);
      throw new BadRequestException("Unable to add address to whitelist");
    }
  }
}
