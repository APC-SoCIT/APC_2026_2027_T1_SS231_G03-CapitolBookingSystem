import type { OrderItem } from "./delivery";
import { supabase } from "../lib/supabase";
import { bookingTimeToSql } from "../lib/booking-time";

export { BOOKING_TIME_OPTIONS, bookingTimeToSql, sqlTimeToBookingLabel } from "../lib/booking-time";

export type ReservationStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

export type ReservationTimeline = {
  status: ReservationStatus;
  at: string;
};

export type FunctionBooking = {
  id: string;
  kind: "function_room";
  room: "Private Dining Room";
  customer: string;
  phone: string;
  email: string;
  guests: number;
  eventType: string;
  date: string;
  time: string;
  status: ReservationStatus;
  specialRequests: string;
  placedAt: string;
  timeline: ReservationTimeline[];
};

export type CateringKind = "catering_buffet" | "catering_packed";

export type CateringBooking = {
  id: string;
  kind: CateringKind;
  customer: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  status: ReservationStatus;
  placedAt: string;
  timeline: ReservationTimeline[];
  notes: string;
  packageId?: string;
  packageName?: string;
  packagePrice?: number;
  pax?: number;
  pricePerPax?: number;
  itemsList?: OrderItem[];
  guestCount?: number;
  subtotal?: number;
  total?: number;
};

export type BookingInventoryKind = "function_room" | CateringKind;

export type BookingAvailability = {
  kind: BookingInventoryKind;
  resourceId: string;
  date: string;
  time: string;
};

export type MonthAvailability = {
  reservedDates: string[];
  bookedSlots: BookingAvailability[];
};

export const FUNCTION_ROOM_ID = "private_dining";

export class SlotTakenError extends Error {
  constructor() {
    super("This booking slot was just taken");
    this.name = "SlotTakenError";
  }
}

function newBookingId(): string {
  return `CAP-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
}

export async function fetchMonthAvailability(
  year: number,
  month: number,
): Promise<MonthAvailability> {
  const from = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const nextMonth = new Date(year, month + 1, 1);
  const to = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-01`;
  const [slotsResult, datesResult] = await Promise.all([
    supabase
      .from("booking_availability")
      .select("kind, resource_id, date, time")
      .gte("date", from)
      .lt("date", to),
    supabase
      .from("reserved_dates")
      .select("date")
      .gte("date", from)
      .lt("date", to),
  ]);

  if (slotsResult.error) throw slotsResult.error;
  if (datesResult.error) throw datesResult.error;

  return {
    reservedDates: (datesResult.data ?? []).map(({ date }) => date),
    bookedSlots: (slotsResult.data ?? []).map((slot) => ({
      kind: slot.kind as BookingInventoryKind,
      resourceId: slot.resource_id as string,
      date: slot.date as string,
      time: slot.time as string,
    })),
  };
}

export function subscribeAvailability(onChange: () => void) {
  return supabase
    .channel("booking-calendar-availability")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "booking_availability" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "reserved_dates" },
      onChange,
    )
    .subscribe();
}

export async function createFunctionBooking(input: {
  userId: string;
  customer: string;
  phone: string;
  email: string;
  guests: number;
  eventType: string;
  date: string;
  time: string;
  specialRequests: string;
}): Promise<string> {
  const id = newBookingId();
  const { error } = await supabase.from("function_bookings").insert({
    id,
    user_id: input.userId,
    room_id: FUNCTION_ROOM_ID,
    customer: input.customer,
    phone: input.phone,
    email: input.email,
    guests: input.guests,
    event_type: input.eventType,
    date: input.date,
    time: bookingTimeToSql(input.time),
    status: "Pending",
    special_requests: input.specialRequests,
    timeline: [{ status: "Pending", at: nowStamp() }],
  });

  if (error) {
    if (
      error.code === "23505" &&
      error.message.includes("function_bookings_active_slot_unique")
    ) {
      throw new SlotTakenError();
    }
    throw error;
  }
  return id;
}

export async function createCateringBooking(input: {
  userId: string;
  kind: CateringKind;
  customer: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  notes: string;
  packageId?: string;
  packageName?: string;
  pax?: number;
  pricePerPax?: number;
  itemsList?: OrderItem[];
  guestCount?: number;
  subtotal?: number;
  total?: number;
}): Promise<string> {
  const id = newBookingId();
  const { error } = await supabase.from("catering_bookings").insert({
    id,
    user_id: input.userId,
    kind: input.kind,
    customer: input.customer,
    phone: input.phone,
    email: input.email,
    date: input.date,
    time: bookingTimeToSql(input.time),
    status: "Pending",
    timeline: [{ status: "Pending", at: nowStamp() }],
    notes: input.notes,
    package_id: input.packageId ?? null,
    package_name: input.packageName ?? null,
    pax: input.pax ?? null,
    price_per_pax: input.pricePerPax ?? null,
    items_list: input.itemsList ?? [],
    guest_count: input.guestCount ?? null,
    subtotal: input.subtotal ?? 0,
    total: input.total ?? 0,
  });

  if (error) {
    if (
      error.code === "23505" &&
      error.message.includes("catering_bookings_active_slot_unique")
    ) {
      throw new SlotTakenError();
    }
    throw error;
  }
  return id;
}

export const RESERVATION_STATUSES: ReservationStatus[] = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
];

function nowStamp(): string {
  return new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const FUNC_KEY = "capitol-function-bookings";
const CATERING_KEY = "capitol-catering-bookings";

const INITIAL_FUNCTION: FunctionBooking[] = [
  {
    id: "BK-F101",
    kind: "function_room",
    room: "Private Dining Room",
    customer: "Rosa Mendoza",
    phone: "0917 222 3344",
    email: "rosa.mendoza@example.com",
    guests: 30,
    eventType: "Birthday Celebration",
    date: "2026-09-18",
    time: "6:00 PM",
    status: "Pending",
    specialRequests: "Need projector and birthday backdrop",
    placedAt: "Today, 10:20 AM",
    timeline: [{ status: "Pending", at: "Today, 10:20 AM" }],
  },
  {
    id: "BK-F102",
    kind: "function_room",
    room: "Private Dining Room",
    customer: "Paolo Garcia",
    phone: "0918 333 4455",
    email: "paolo.garcia@example.com",
    guests: 80,
    eventType: "Wedding Reception",
    date: "2026-09-22",
    time: "5:00 PM",
    status: "Confirmed",
    specialRequests: "Sound system + 8 extra chairs",
    placedAt: "Yesterday, 4:45 PM",
    timeline: [
      { status: "Pending", at: "Yesterday, 4:45 PM" },
      { status: "Confirmed", at: "Today, 9:00 AM" },
    ],
  },
];

const INITIAL_CATERING: CateringBooking[] = [
  {
    id: "BK-C201",
    kind: "catering_buffet",
    customer: "Maria Santos",
    phone: "0917 123 4567",
    email: "maria.santos@example.com",
    date: "2026-09-19",
    time: "11:00 AM",
    status: "Pending",
    placedAt: "Today, 2:15 PM",
    timeline: [{ status: "Pending", at: "Today, 2:15 PM" }],
    notes: "Round-trip delivery within Pasay",
    packageId: "pkg-2",
    packageName: "Package B",
    packagePrice: 3150,
    pax: 10,
    pricePerPax: 315,
    guestCount: 10,
    subtotal: 3150,
    total: 3150,
  },
  {
    id: "BK-C202",
    kind: "catering_packed",
    customer: "Juan dela Cruz",
    phone: "0918 987 6543",
    email: "juan.delacruz@example.com",
    date: "2026-09-20",
    time: "12:00 PM",
    status: "Confirmed",
    placedAt: "Today, 3:40 PM",
    timeline: [
      { status: "Pending", at: "Today, 3:40 PM" },
      { status: "Confirmed", at: "Today, 4:10 PM" },
    ],
    notes: "Extra utensils for 20 guests",
    itemsList: [
      { id: "pm-01", type: "packed_meal", name: "Buttered Chicken", quantity: 8, price: 100, category: "Solo meals" },
      { id: "pm-02", type: "packed_meal", name: "Capitol Chicken", quantity: 6, price: 100, category: "Solo meals" },
      { id: "pm-09", type: "packed_meal", name: "Sweet & Sour Fish", quantity: 6, price: 100, category: "Solo meals" },
    ],
    guestCount: 20,
    subtotal: 2000,
    total: 2000,
  },
];

function normalizeFunction(list: FunctionBooking[]): FunctionBooking[] {
  return list.map((b) => ({
    ...b,
    timeline: b.timeline ?? [{ status: b.status, at: b.placedAt }],
  }));
}
function normalizeCatering(list: CateringBooking[]): CateringBooking[] {
  return list.map((b) => ({
    ...b,
    timeline: b.timeline ?? [{ status: b.status, at: b.placedAt }],
  }));
}

export function getFunctionBookings(): FunctionBooking[] {
  const raw = localStorage.getItem(FUNC_KEY);
  if (!raw) return INITIAL_FUNCTION;
  try {
    return normalizeFunction(JSON.parse(raw) as FunctionBooking[]);
  } catch {
    return INITIAL_FUNCTION;
  }
}
export function saveFunctionBookings(list: FunctionBooking[]) {
  localStorage.setItem(FUNC_KEY, JSON.stringify(list));
}
export function getCateringBookings(): CateringBooking[] {
  const raw = localStorage.getItem(CATERING_KEY);
  if (!raw) return INITIAL_CATERING;
  try {
    return normalizeCatering(JSON.parse(raw) as CateringBooking[]);
  } catch {
    return INITIAL_CATERING;
  }
}
export function saveCateringBookings(list: CateringBooking[]) {
  localStorage.setItem(CATERING_KEY, JSON.stringify(list));
}

export function addFunctionBooking(b: FunctionBooking) {
  const list = getFunctionBookings();
  list.push(b);
  saveFunctionBookings(list);
}
export function addCateringBooking(b: CateringBooking) {
  const list = getCateringBookings();
  list.push(b);
  saveCateringBookings(list);
}
export function updateFunctionBooking(updated: FunctionBooking) {
  const list = getFunctionBookings().map((x) => (x.id === updated.id ? updated : x));
  saveFunctionBookings(list);
}
export function updateCateringBooking(updated: CateringBooking) {
  const list = getCateringBookings().map((x) => (x.id === updated.id ? updated : x));
  saveCateringBookings(list);
}

export function nextFunctionId(): string {
  const count = getFunctionBookings().length;
  return `BK-F${101 + count}`;
}
export function nextCateringId(): string {
  const count = getCateringBookings().length;
  return `BK-C${201 + count}`;
}

export function pushTimeline(
  timeline: ReservationTimeline[] | undefined,
  nextStatus: ReservationStatus,
): ReservationTimeline[] {
  const t = [...(timeline ?? [])];
  t.push({ status: nextStatus, at: nowStamp() });
  return t;
}
