import { getAbiItem, GetLogsReturnType } from "viem";
import { erc20Abi, feeManagerAbi } from "../../abis/abi";

export const RewardsConvertedToUsdcAbiEvent = getAbiItem({ abi: feeManagerAbi, name: "RewardsConvertedToUsdc" });
export const TransferAbiEvent = getAbiItem({ abi: erc20Abi, name: "Transfer" });

export type SingleLogEvent =
  | GetLogsReturnType<typeof RewardsConvertedToUsdcAbiEvent>[number]
  | GetLogsReturnType<typeof TransferAbiEvent>[number];

export function isRewardsConvertedToUsdcEvent(
  log: SingleLogEvent,
): log is GetLogsReturnType<typeof RewardsConvertedToUsdcAbiEvent>[number] {
  return typeof log === "object" && log !== null && log.eventName == "RewardsConvertedToUsdc";
}

export function isTransferEvent(log: SingleLogEvent): log is GetLogsReturnType<typeof TransferAbiEvent>[number] {
  return typeof log === "object" && log !== null && log.eventName == "Transfer";
}
