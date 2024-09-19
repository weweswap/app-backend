import { plainToClass } from "class-transformer";
import { validateSync } from "class-validator";
import { ClassConstructor } from "class-transformer/types/interfaces";

export function validateUtil<Type extends object>(
  config: Record<string, unknown>,
  envVariablesClass: ClassConstructor<Type>,
) {
  const validatedConfig = plainToClass(envVariablesClass, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
