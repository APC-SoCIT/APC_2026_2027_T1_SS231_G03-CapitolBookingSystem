import assert from "node:assert/strict";
import {
  bookingTimeToSql,
  sqlTimeToBookingLabel,
} from "../src/lib/booking-time.ts";

assert.equal(bookingTimeToSql("9:00 AM"), "09:00:00");
assert.equal(bookingTimeToSql("12:00 PM"), "12:00:00");
assert.equal(bookingTimeToSql("12:30 PM"), "12:30:00");
assert.equal(bookingTimeToSql("7:30 PM"), "19:30:00");
assert.equal(sqlTimeToBookingLabel("00:30:00"), "12:30 AM");
assert.equal(sqlTimeToBookingLabel("13:00:00"), "1:00 PM");
assert.throws(() => bookingTimeToSql("12:15 PM"), /Invalid booking time/);
assert.throws(() => bookingTimeToSql("8:00 PM"), /Invalid booking time/);

console.log("booking time test passed: 8 checks");
