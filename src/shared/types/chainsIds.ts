import * as chains from "viem/chains";

export type KnownChainId = (typeof chains)[keyof typeof chains]["id"];

export type ChainId = KnownChainId | number;
