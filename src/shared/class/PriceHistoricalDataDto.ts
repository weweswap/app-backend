export class PriceHistoricalMetadataDto {
  coinId: string;
  price: number;

  constructor(coinId: string, price: number) {
    this.coinId = coinId;
    this.price = price;
  }
}

export class PriceHistoricalDataDto {
  timestamp: Date;
  metadata: PriceHistoricalMetadataDto;

  constructor(timestamp: Date, metadata: PriceHistoricalMetadataDto) {
    this.timestamp = timestamp;
    this.metadata = metadata;
  }
}
