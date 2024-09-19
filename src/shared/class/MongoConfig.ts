import { Contains, IsNotEmpty, IsString } from "class-validator";

export class MongoConfig {
  @IsString()
  @IsNotEmpty()
  dbName: string;

  @IsString()
  @IsNotEmpty()
  @Contains("mongodb")
  url: string;
}
