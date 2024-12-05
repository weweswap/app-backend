import { ApiProperty } from "@nestjs/swagger";
import { Address } from "viem";

export class ChaosLeaderboardEntry {
  @ApiProperty({
    description: "Address of the user.",
    example: "0x1234567890abcdef1234567890abcdef12345678",
    type: String,
  })
  address: Address;

  @ApiProperty({
    description: "Total CHAOS rewards accumulated",
    example: 69420,
    type: Number,
  })
  totalChaosRewards: number;

  constructor(address: Address, totalChaosRewards: number) {
    this.address = address;
    this.totalChaosRewards = totalChaosRewards;
  }
}

export class ChaosLeaderboardResponseDto {
  @ApiProperty({
    description: "Top 10 accumulated CHAOS leaderboard",
    type: Array<ChaosLeaderboardEntry>,
  })
  chaosLeaderboard: Array<ChaosLeaderboardEntry>;
}
