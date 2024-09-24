import { IsEthereumAddress } from "class-validator";

export class GetAprParamsDto {
  @IsEthereumAddress()
  address: string;
}
