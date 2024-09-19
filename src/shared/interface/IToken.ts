import { Address } from "viem";

export interface IToken {
  ticker: string;
  address: Address;
  decimals: number;
}
