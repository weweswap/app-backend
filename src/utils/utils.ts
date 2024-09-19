import { Token } from "../shared/types/common";
import { DateTime } from "luxon";

export function getEndOfPreviousDayTimestamp(): number {
  const now = new Date();
  const previousDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 0, 0, 0);
  return previousDay.getTime();
}

export function adjustPresentationDecimals(token: Token, presentationDecimals: number): Token {
  return {
    ...token,
    presentationDecimals: presentationDecimals.toString(),
  };
}

export function scheduleToTheNextFullDay(fn: () => void): void {
  const now = DateTime.local();

  const nextDayWithBuffer = now.plus({ day: 1 }).startOf("day").plus({ minute: 1 });
  const timeToNextDay = nextDayWithBuffer.diff(now).as("milliseconds") + 10000;

  setTimeout(fn, timeToNextDay);
}
