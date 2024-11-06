import { ApiProperty } from "@nestjs/swagger";
import { Address } from "viem";

export class WhitelistInfoDto {
  @ApiProperty({
    description: "Address of the merged project.",
    example: "0x1234567890abcdef1234567890abcdef12345678",
    type: String,
  })
  projectAddress: Address;

  @ApiProperty({
    description: "Address of the requested user.",
    example: "0x1234567890abcdef1234567890abcdef12345678",
    type: String,
  })
  address: Address;

  @ApiProperty({
    description: "Amount that the user is whitelisted for",
    example: "0x1234567890abcdef1234567890abcdef12345678",
    type: String,
  })
  amount: string;

  @ApiProperty({
    description: "Merkle proof for the user",
    example: [
      "0x43e72132b83ac79199686ea8a4108baz98be8458a48140e448b646c1668be480",
      "0x1a75c7f7b2063959beb1128a49f0d4b288f5b4152c4fad00d8869u5966106539",
    ],
    type: [String],
  })
  proof: string[];

  constructor(projectAddress: Address, address: Address, amount: string, proof: string[]) {
    this.projectAddress = projectAddress;
    this.address = address;
    this.amount = amount;
    this.proof = proof;
  }
}

export class WhitelistInfoResponseDto {
  whitelistInfo: WhitelistInfoDto;
}
