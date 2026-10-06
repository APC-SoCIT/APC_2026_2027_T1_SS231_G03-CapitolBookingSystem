export const BOOKING_TIME_OPTIONS = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
  "3:30 PM",
  "4:00 PM",
  "4:30 PM",
  "5:00 PM",
  "5:30 PM",
  "6:00 PM",
  "6:30 PM",
  "7:00 PM",
  "7:30 PM",
] as const;

export function bookingTimeToSql(value: string): string {
  const match = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(value);
  if (!match) throw new Error("Invalid booking time");

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 1 || hour > 12 || (minute !== 0 && minute !== 30)) {
    throw new Error("Invalid booking time");
  }

  const hour24 = (hour % 12) + (match[3] === "PM" ? 12 : 0);
  if (hour24 < 9 || hour24 > 19 || (hour24 === 19 && minute > 30)) {
    throw new Error("Invalid booking time");
  }
  return `${String(hour24).padStart(2, "0")}:${match[2]}:00`;
}

export function sqlTimeToBookingLabel(value: string): string {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return value;
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${hour < 12 ? "AM" : "PM"}`;
}
