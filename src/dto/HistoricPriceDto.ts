import { ApiProperty } from "@nestjs/swagger";

export class HistoricPriceDatapoint {
  @ApiProperty({
    description: "UNIX timestamp in seconds",
    example: "1725235621",
    type: Number,
  })
  timestamp: number;

  @ApiProperty({
    description: "Vault token price of the Arrakis Vault",
    example: 4.612,
    type: Number,
  })
  price: number;

  constructor(timestamp: number, price: number) {
    this.timestamp = timestamp;
    this.price = price;
  }
}
