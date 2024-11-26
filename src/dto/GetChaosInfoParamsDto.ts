import { IsEthereumAddress } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GetChaosInfoParamsDto {
  @ApiProperty({
    description: "Ethereum address of the user.",
    example: "0x1234567890abcdef1234567890abcdef12345678",
    type: String,
  })
  @IsEthereumAddress()
  address: string;
}
