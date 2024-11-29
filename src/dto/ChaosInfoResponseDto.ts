import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";
import { Address } from "viem";

export class ChaosInfoResponseDto {
  @ApiProperty({
    description: "Address of the user.",
    example: "0x1234567890abcdef1234567890abcdef12345678",
    type: String,
  })
  address: Address;

  @ApiProperty({
    description: "Ranking on the CHAOS Leaderboard",
    example: 5,
    type: Number,
  })
  @IsInt()
  @Min(1)
  leaderboardRank: number;

  @ApiProperty({
    description: "Total CHAOS rewards accumulated",
    example: 69420,
    type: Number,
  })
  totalChaosRewards: number;

  constructor(address: Address, leaderboardRank: number, totalChaosRewards: number) {
    this.address = address;
    this.leaderboardRank = leaderboardRank;
    this.totalChaosRewards = totalChaosRewards;
  }
}
