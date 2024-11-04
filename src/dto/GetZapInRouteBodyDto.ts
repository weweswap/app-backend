import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress, IsNumberString } from "class-validator";

export class GetZapInRouteBodyDto {
  @ApiProperty({
    description: "Address of the vault",
    example: "0x1234567890abcdef1234567890abcdef12345678",
  })
  @IsEthereumAddress()
  vaultAddress: string;

  @ApiProperty({
    description: "Address of the input token",
    example: "0x1234567890abcdef1234567890abcdef12345678",
  })
  @IsEthereumAddress()
  inputToken: string;

  @IsNumberString()
  tokenInAmount: string;
}