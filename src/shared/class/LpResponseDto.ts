import { Address } from "viem";

export class LpResponseDto {
  address: Address;
  feeApr: number;

  constructor(address: Address, feeApr: number) {
    this.address = address;
    this.feeApr = feeApr;
  }
}
