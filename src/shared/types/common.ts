import { Address } from "viem";

export class Token {
  address: string;
  ticker: string;
  chain: string;
  decimals: string;
  presentationDecimals: string;
}

export class ArrakisResolverInput {
  vault: Address;
  amount0Max: bigint;
  amount1Max: bigint;
}
