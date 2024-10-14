import { Injectable } from "@nestjs/common";
import { EvmConnectorService } from "../../blockchain-connectors/evm-connector/evm-connector.service";
import { Memoize, MemoizeExpiring } from "typescript-memoize";
import { Address, getContract, GetContractReturnType, PublicClient } from "viem";
import { feeManagerAbi } from "../../abis/abi";
import { ONE_HOUR_IN_MILLISECONDS } from "../../shared/constants";

@Injectable()
export class FeeManagerContractsService {
  constructor(private evmConnector: EvmConnectorService) {}

  /**
   * Fetches incentive rate from feeManagerContract
   */
  @MemoizeExpiring(ONE_HOUR_IN_MILLISECONDS)
  public async getRate(feeManagerAddress: Address): Promise<number> {
    const feeManagerContract = this.getFeeManagerContract(feeManagerAddress);
    const rate = await feeManagerContract.read.rate();

    return Number(rate) / 100; // contract returns bigint with 2 decimals
  }

  /**
   * Fetches the associated Arrakis vault address (LMv1 -> 1 feeManager per 1 vault)
   */
  @MemoizeExpiring(ONE_HOUR_IN_MILLISECONDS)
  public async getVaultAddress(feeManagerAddress: Address): Promise<Address> {
    const feeManagerContract = this.getFeeManagerContract(feeManagerAddress);
    return await feeManagerContract.read.vault();
  }

  /**
   * Construct Fee Manager Viem Contract instance
   * @param feeManagerAddress - Fee Manager Address
   * @private
   */
  @Memoize()
  private getFeeManagerContract(feeManagerAddress: Address): GetContractReturnType<typeof feeManagerAbi, PublicClient> {
    return getContract({
      address: feeManagerAddress,
      abi: feeManagerAbi,
      client: this.evmConnector.client,
    });
  }
}
