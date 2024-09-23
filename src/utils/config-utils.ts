import { LogLevel } from "../shared/enum/LogLevel";

/**
 * Config util functions
 */
export abstract class ConfigUtils {
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
