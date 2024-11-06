import { ApiProperty } from "@nestjs/swagger";
import { IsEthereumAddress } from "class-validator";

export class GetWhitelistInfoParamsDto {
  @ApiProperty({
    description: "Address of the merge project",
    example: "0x1234567890abcdef1234567890abcdef12345678",
  })
  @IsEthereumAddress()
  address: string;
}
