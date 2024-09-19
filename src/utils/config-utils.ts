import { EnvType } from "../shared/enum/EnvType";
import { LogLevel } from "../shared/enum/LogLevel";

/**
 * Config util functions
 */
export abstract class ConfigUtils {
  public static loadEnvFileName(env: string | undefined): EnvType {
    switch (env) {
      case EnvType.DEV_ARB:
        return EnvType.DEV_ARB;
      case EnvType.DEV_AVAX:
        return EnvType.DEV_AVAX;
      case EnvType.DEV_POL:
        return EnvType.DEV_POL;
      case EnvType.DEV_BASE:
        return EnvType.DEV_BASE;
      case EnvType.PROD:
        return EnvType.PROD;
      case EnvType.TEST:
        return EnvType.TEST;
      default:
        throw new Error("Invalid environment parameter. Should be one of ['arb', 'avax', 'pol', 'prod', 'test']");
    }
  }

  public static loadRpcUrl(rpcUrl: string | undefined): string {
    if (rpcUrl) {
      return rpcUrl;
    } else {
      throw new Error("Undefined process.env.RPC_URL !");
    }
  }

  public static loadEnvStringArray(value: string | undefined): string[] {
    return JSON.parse(value ?? "[]");
  }

  public static loadLogLevelEnv(logLevel: string | undefined) {
    if (logLevel) {
      if (Object.values(LogLevel).includes(logLevel as LogLevel)) {
        return logLevel as LogLevel;
      } else {
        throw new Error(`Invalid LOG_LEVEL format. Must be of enum type LogLevel (debug, info) !`);
      }
    } else {
      // default to debug
      return LogLevel.debug;
    }
  }
}
