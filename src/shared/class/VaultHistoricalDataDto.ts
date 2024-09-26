export class VaultHistoricalMetadataDto {
  vaultAddress: string;
  tvlUsd: number;
  vaultTokenPrice: number;
  token0Price: number;
  token1Price: number;

  constructor(vaultAddress: string, tvlUsd: number, vaultTokenPrice: number, token0Price: number, token1Price: number) {
    this.vaultAddress = vaultAddress;
    this.tvlUsd = tvlUsd;
    this.vaultTokenPrice = vaultTokenPrice;
    this.token0Price = token0Price;
    this.token1Price = token1Price;
  }
}

export class VaultHistoricalDataDto {
  timestamp: Date;
  metadata: VaultHistoricalMetadataDto;

  constructor(timestamp: Date, metadata: VaultHistoricalMetadataDto) {
    this.timestamp = timestamp;
    this.metadata = metadata;
  }
}
