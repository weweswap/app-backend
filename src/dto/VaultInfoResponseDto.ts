import { ApiProperty } from "@nestjs/swagger";
import { Address } from "viem";

export class VaultInfoResponseDto {
  @ApiProperty({
    description: "Address of the vault.",
    example: "0x1234567890abcdef1234567890abcdef12345678",
    type: String,
  })
  address: Address;

  @ApiProperty({
    description: "Annual Percentage Rate (APR) for fees. (Based on 7 day timeframe)",
    example: 5.25,
    type: Number,
  })
  feeApr: number;

  @ApiProperty({
    description: "Total fees accumulated per day in USD.",
    example: 0.15,
    type: Number,
  })
  feesPerDay: number;

  @ApiProperty({
    description: "Total incentives accumulated per day.",
    example: 15,
    type: Number,
  })
  incentivesPerDay: number;

  @ApiProperty({
    description: "Total fees accumulated per week in USD.",
    example: 524,
    type: Number,
  })
  feesPerWeek: number;

  constructor(address: Address, feeApr: number, feesPerDay: number, incentivesPerDay: number, feesPerWeek: number) {
    this.address = address;
    this.feeApr = feeApr;
    this.feesPerDay = feesPerDay;
    this.incentivesPerDay = incentivesPerDay;
    this.feesPerWeek = feesPerWeek;
  }
}
