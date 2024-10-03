import { TimeFrame } from "../dto/HistoricDataQueryParamsDto";
import { Token } from "../shared/types/common";
import { DateTime } from "luxon";

export function getEndOfPreviousDayTimestamp(): number {
  const now = new Date();
  const previousDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 0, 0, 0);
  return previousDay.getTime();
}

/**
 * Returns the timestamp (in milliseconds) of the last full hour.
 * For example, if the current time is 10:37, it returns 10:00.
 */
export function getLastFullHourTimestamp(): number {
  const now = new Date();
  now.setMinutes(0, 0, 0); // Set minutes, seconds, and milliseconds to zero
  return now.getTime();
}

export function adjustPresentationDecimals(token: Token, presentationDecimals: number): Token {
  return {
    ...token,
    presentationDecimals: presentationDecimals.toString(),
  };
}

export function scheduleToTheNextFullHour(fn: () => void): void {
  const now = DateTime.local();

  const nextHourWithBuffer = now.plus({ hour: 1 }).startOf("hour").plus({ minute: 1 });
  const timeToNextHour = nextHourWithBuffer.diff(now).as("milliseconds") + 10000;

  setTimeout(fn, timeToNextHour);
}
/**
 * Calculates the start date for a given timeframe relative to the current date.
 * This function adjusts the current date to reflect the start of a specific timeframe,
 * allowing for the easy retrieval of dates such as one day ago, one week ago, or one year ago.
 *
 * @param {TimeFrame} timeframe - The timeframe enumeration value representing the period.
 *        Supported timeframes include Day, Week, Month, SixMonths, Year, and All.
 * @returns {Date} The calculated start date of the specified timeframe from the current date.
 */
export function getStartDateFromNow(timeframe: TimeFrame): Date {
  const now = new Date();
  const timeFrameStartDate = new Date();

  switch (timeframe) {
    case TimeFrame.Daily:
      timeFrameStartDate.setDate(now.getDate() - 1);
      break;
    case TimeFrame.Weekly:
      timeFrameStartDate.setDate(now.getDate() - 7);
      break;
  }

  return timeFrameStartDate;
}
