import { ApiProperty } from "@nestjs/swagger";

export class MergeChartDatapoint {
  @ApiProperty({
    description: "UNIX timestamp in seconds",
    example: 1725235621,
    type: Number,
  })
  timestamp: number;

  @ApiProperty({
    description: "WEWE tokenprice",
    example: 4.612,
    type: Number,
  })
  wewePrice: number;

  @ApiProperty({
    description: "Token price for merge coin",
    example: 2.123,
    type: Number,
  })
  mergeCoinPrice: number;

  constructor(timestamp: number, wewePrice: number, mergeCoinPrice: number) {
    this.timestamp = timestamp;
    this.wewePrice = wewePrice;
    this.mergeCoinPrice = mergeCoinPrice;
  }
}
