import { Address } from "viem";

export class VaultInfoResponseDto {
  address: Address;
  feeApr: number;
  feesPerDay: number;

  constructor(address: Address, feeApr: number, feesPerDay: number) {
    this.address = address;
    this.feeApr = feeApr;
    this.feesPerDay = feesPerDay;
  }
}
