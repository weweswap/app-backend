import { getAbiItem, GetLogsReturnType } from "viem";
import { arrakisVaultAbi } from "../../abis/abi";

export const LpVaultCollectedFeesAbiEvent = getAbiItem({ abi: arrakisVaultAbi, name: "LogCollectedFees" });

export type SingleLogEvent = GetLogsReturnType<typeof LpVaultCollectedFeesAbiEvent>[number];

export function isLpVaultCollectedFeesEvent(
  log: SingleLogEvent,
): log is GetLogsReturnType<typeof LpVaultCollectedFeesAbiEvent>[number] {
  return typeof log === "object" && log !== null && log.eventName == "LogCollectedFees";
}
