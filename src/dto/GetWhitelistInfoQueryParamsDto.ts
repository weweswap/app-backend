import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress } from "class-validator";

export class GetWhitelistInfoQueryParamsDto {
  @ApiProperty({
    description: "Address of the requested user",
    example: "0x1234567890abcdef1234567890abcdef12345678",
  })
  @IsEthereumAddress()
  userAddress: string;
}
