export type TimeFormat = "s" | "m" | "h" | "d";

export function convertMiliseconds(miliseconds: number, format: TimeFormat): number {
  const total_seconds = Math.floor(miliseconds / 1000);
  const total_minutes = Math.floor(total_seconds / 60);
  const total_hours = Math.floor(total_minutes / 60);
  const days = Math.floor(total_hours / 24);

  switch (format) {
    case "s":
      return total_seconds;
    case "m":
      return total_minutes;
    case "h":
      return total_hours;
    case "d":
      return days;
    default:
      throw new Error("[convertMiliseconds] Unsupported format!");
  }
}

export function timeDiffIsLessThan(timestampMs0: number, timestampMs1: number, maxDiffMs: number): boolean {
  return Math.abs(timestampMs0 - timestampMs1) < maxDiffMs;
}

export async function wait(time: number) {
  return new Promise((res) => setTimeout(res, time));
}
