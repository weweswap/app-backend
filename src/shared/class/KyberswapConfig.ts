import { Transform } from "class-transformer";
import { Contains, IsEthereumAddress, IsNotEmpty, IsNumber, IsString } from "class-validator";
import { Address } from "viem";

export class KyberswapConfig {
  @IsString()
  @IsNotEmpty()
  chain: string;

  @IsString()
  @IsNotEmpty()
  @Contains("kyberswap")
  url: string;

  @Transform(({ value }) => value.toLowerCase() as Address, { toClassOnly: true })
  @IsEthereumAddress()
  senderAddress: Address;

  @Transform(({ value }) => value.toLowerCase() as Address, { toClassOnly: true })
  @IsEthereumAddress()
  recipientAddress: Address;

  @IsNumber()
  slippageTolerance: number;

  @IsString()
  @IsNotEmpty()
  clientId: string;
}
