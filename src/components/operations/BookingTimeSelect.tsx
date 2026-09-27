import { BOOKING_TIME_OPTIONS } from "../../lib/booking-time";

export function BookingTimeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <select className="ops-input" value={value} onChange={(event) => onChange(event.target.value)}>
      {BOOKING_TIME_OPTIONS.map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
    </select>
  );
}
