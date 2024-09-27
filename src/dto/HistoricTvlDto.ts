import { ApiProperty } from "@nestjs/swagger";

export class HistoricTvlDatapoint {
  @ApiProperty({
    description: "UNIX timestamp in seconds",
    example: 1725235621,
    type: Number,
  })
  timestamp: number;

  @ApiProperty({
    description: "TVL (Total Value Locked) of the Arrakis Vault",
    example: 474.677,
    type: Number,
  })
  tvl: number;

  constructor(timestamp: number, tvl: number) {
    this.timestamp = timestamp;
    this.tvl = tvl;
  }
}
