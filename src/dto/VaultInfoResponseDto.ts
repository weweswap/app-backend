import { Address } from "viem";

export class VaultInfoResponseDto {
  address: Address;
  feeApr: number;

  constructor(address: Address, feeApr: number) {
    this.address = address;
    this.feeApr = feeApr;
  }
}
