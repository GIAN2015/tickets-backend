// src/utils/date.ts (del backend)
import { formatInTimeZone } from "date-fns-tz";
export const APP_TZ = "America/Lima";

export function fmtEmailDateTime(date: Date | string | number) {
  return formatInTimeZone(date, APP_TZ, "dd/MM/yyyy HH:mm");
}
