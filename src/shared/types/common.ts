export interface VaultFees {
  fee0: bigint;
  fee1: bigint;
}

export interface ArrakisUnderlyingAmounts {
  amount0: bigint;
  amount1: bigint;
  fee0: bigint;
  fee1: bigint;
  leftOver0: bigint;
  leftOver1: bigint;
}

export type ranges = readonly {
  lowerTick: number;
  upperTick: number;
  feeTier: number;
}[];

export class Token {
  address: string;

  ticker: string;

  chain: string;

  decimals: string;

  presentationDecimals: string;
}
