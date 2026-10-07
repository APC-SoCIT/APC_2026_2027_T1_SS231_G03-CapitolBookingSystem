import type { OrderItem } from "./delivery";
import { supabase } from "../lib/supabase";
import { bookingTimeToSql, sqlTimeToBookingLabel } from "../lib/booking-time";

export { BOOKING_TIME_OPTIONS, bookingTimeToSql, sqlTimeToBookingLabel } from "../lib/booking-time";

export type ReservationStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";

export type ReservationTimeline = {
  status: ReservationStatus;
  at: string;
};

export type FunctionBooking = {
  id: string;
  kind: "function_room";
  room: string;
  roomId: string;
  updatedAt: string;
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
  venueType: CateringVenue;
  functionRoomId?: string;
  functionRoomName?: string;
  deliveryAddress?: string;
  packageId?: string;
  packageName?: string;
  packagePrice?: number;
  pax?: number;
  pricePerPax?: number;
  itemsList?: OrderItem[];
  guestCount?: number;
  subtotal?: number;
  total?: number;
  updatedAt: string;
};

export type BookingInventoryKind = "function_room" | CateringKind;

export type BookingAvailability = {
  kind: BookingInventoryKind;
  resourceId: string;
  date: string;
};

export type MonthAvailability = {
  reservedDates: string[];
  bookedSlots: BookingAvailability[];
};

export const FUNCTION_ROOM_A_ID = "room_a";
export const FUNCTION_ROOM_B_ID = "room_b";
/** Back-compat default; new code passes an explicit room. */
export const FUNCTION_ROOM_ID = FUNCTION_ROOM_A_ID;

export const FUNCTION_ROOM_CHOICES = [
  { id: FUNCTION_ROOM_A_ID, name: "Function Room A" },
  { id: FUNCTION_ROOM_B_ID, name: "Function Room B" },
] as const;

export class SlotTakenError extends Error {
  constructor() {
    super("This booking slot was just taken");
    this.name = "SlotTakenError";
  }
}

export class BookingChangedError extends Error {
  constructor() {
    super("This booking changed in another session");
    this.name = "BookingChangedError";
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
      .select("kind, resource_id, date")
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
  roomId: string;
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
    room_id: input.roomId,
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
    throwBookingError(error, "function_bookings_active_date_unique");
  }
  return id;
}

export type CateringVenue = "function_room" | "delivery";

export async function createCateringBooking(input: {
  userId: string;
  kind: CateringKind;
  customer: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  notes: string;
  venueType?: CateringVenue;
  functionRoomId?: string;
  deliveryAddress?: string;
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
  const venueType = input.venueType ?? "delivery";
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
    venue_type: venueType,
    function_room_id:
      venueType === "function_room" ? (input.functionRoomId ?? null) : null,
    delivery_address:
      venueType === "delivery" ? (input.deliveryAddress ?? null) : null,
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
    throwBookingError(error, "catering_bookings_active");
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
  return formatPlacedAt(new Date().toISOString());
}

function formatPlacedAt(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type FunctionBookingRow = {
  id: string;
  room_id: string;
  function_rooms: { name: string } | null;
  customer: string;
  phone: string;
  email: string;
  guests: number;
  event_type: string;
  date: string;
  time: string;
  status: string;
  special_requests: string | null;
  placed_at: string;
  updated_at: string;
  timeline: ReservationTimeline[] | null;
};

type CateringBookingRow = {
  id: string;
  kind: CateringKind;
  customer: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  status: string;
  placed_at: string;
  updated_at: string;
  timeline: ReservationTimeline[] | null;
  notes: string | null;
  venue_type: CateringVenue | null;
  function_room_id: string | null;
  function_rooms: { name: string } | null;
  delivery_address: string | null;
  package_id: string | null;
  package_name: string | null;
  pax: number | null;
  price_per_pax: number | null;
  items_list: OrderItem[];
  guest_count: number | null;
  subtotal: number;
  total: number;
};

export async function fetchFunctionBookings(): Promise<FunctionBooking[]> {
  const { data, error } = await supabase
    .from("function_bookings")
    .select("id, room_id, function_rooms(name), customer, phone, email, guests, event_type, date, time, status, special_requests, placed_at, updated_at, timeline")
    .order("placed_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as FunctionBookingRow[]).map((row) => {
    const status = row.status as ReservationStatus;
    const placedAt = formatPlacedAt(row.placed_at);
    return {
      id: row.id,
      kind: "function_room",
      room: row.function_rooms?.name ?? row.room_id,
      roomId: row.room_id,
      updatedAt: row.updated_at,
      customer: row.customer,
      phone: row.phone,
      email: row.email,
      guests: row.guests,
      eventType: row.event_type,
      date: row.date,
      time: sqlTimeToBookingLabel(row.time),
      status,
      specialRequests: row.special_requests ?? "",
      placedAt,
      timeline: row.timeline?.length ? row.timeline : [{ status, at: placedAt }],
    };
  });
}

export async function fetchCateringBookings(): Promise<CateringBooking[]> {
  const { data, error } = await supabase
    .from("catering_bookings")
    .select("id, kind, customer, phone, email, date, time, status, placed_at, updated_at, timeline, notes, venue_type, function_room_id, function_rooms(name), delivery_address, package_id, package_name, pax, price_per_pax, items_list, guest_count, subtotal, total")
    .order("placed_at", { ascending: false });
  if (error) throw error;

  return ((data ?? []) as unknown as CateringBookingRow[]).map((row) => {
    const status = row.status as ReservationStatus;
    const placedAt = formatPlacedAt(row.placed_at);
    return {
      id: row.id,
      kind: row.kind,
      customer: row.customer,
      phone: row.phone,
      email: row.email,
      date: row.date,
      time: sqlTimeToBookingLabel(row.time),
      status,
      placedAt,
      updatedAt: row.updated_at,
      timeline: row.timeline?.length ? row.timeline : [{ status, at: placedAt }],
      notes: row.notes ?? "",
      venueType: row.venue_type ?? "delivery",
      functionRoomId: row.function_room_id ?? undefined,
      functionRoomName: row.function_rooms?.name ?? undefined,
      deliveryAddress: row.delivery_address ?? undefined,
      packageId: row.package_id ?? undefined,
      packageName: row.package_name ?? undefined,
      packagePrice: row.total,
      pax: row.pax ?? undefined,
      pricePerPax: row.price_per_pax ?? undefined,
      itemsList: row.items_list ?? [],
      guestCount: row.guest_count ?? undefined,
      subtotal: row.subtotal,
      total: row.total,
    };
  });
}

function throwBookingError(error: { code: string; message: string }, indexName: string): never {
  if (
    error.code === "23505" &&
    (error.message.includes(indexName) ||
      error.message.includes("booking_availability_pkey"))
  ) {
    throw new SlotTakenError();
  }
  throw error;
}

export async function updateFunctionBooking(updated: FunctionBooking): Promise<FunctionBooking> {
  const { data, error } = await supabase
    .from("function_bookings")
    .update({
      room_id: updated.roomId,
      customer: updated.customer,
      phone: updated.phone,
      email: updated.email,
      guests: updated.guests,
      event_type: updated.eventType,
      date: updated.date,
      time: bookingTimeToSql(updated.time),
      status: updated.status,
      special_requests: updated.specialRequests,
      timeline: updated.timeline,
      updated_at: new Date().toISOString(),
    })
    .eq("id", updated.id)
    .eq("updated_at", updated.updatedAt)
    .select("updated_at")
    .maybeSingle();
  if (error) throwBookingError(error, "function_bookings_active_date_unique");
  if (!data) throw new BookingChangedError();
  return { ...updated, updatedAt: data.updated_at };
}

export async function updateCateringBooking(updated: CateringBooking): Promise<CateringBooking> {
  const { data, error } = await supabase
    .from("catering_bookings")
    .update({
      kind: updated.kind,
      customer: updated.customer,
      phone: updated.phone,
      email: updated.email,
      date: updated.date,
      time: bookingTimeToSql(updated.time),
      status: updated.status,
      timeline: updated.timeline,
      notes: updated.notes,
      venue_type: updated.venueType,
      function_room_id: updated.functionRoomId ?? null,
      delivery_address: updated.deliveryAddress ?? null,
      package_id: updated.packageId ?? null,
      package_name: updated.packageName ?? null,
      pax: updated.pax ?? null,
      price_per_pax: updated.pricePerPax ?? null,
      items_list: updated.itemsList ?? [],
      guest_count: updated.guestCount ?? null,
      subtotal: updated.subtotal ?? 0,
      total: updated.total ?? 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", updated.id)
    .eq("updated_at", updated.updatedAt)
    .select("updated_at")
    .maybeSingle();
  if (error) throwBookingError(error, "catering_bookings_active");
  if (!data) throw new BookingChangedError();
  return { ...updated, updatedAt: data.updated_at };
}

export type CancellationTarget =
  | { bookingType: "function_room"; booking: FunctionBooking }
  | { bookingType: "catering"; booking: CateringBooking };

/** Customer request to cancel or move a booking. Stored as an inquiry so
 * staff triage it in Operations; the booking itself is untouched until
 * staff confirm the cancellation or the date move. */
export async function requestBookingChange(input: {
  userId: string;
  customer: string;
  email: string;
  target: CancellationTarget;
  action: "cancel" | "move";
  reason: string;
  newDate?: string;
}): Promise<string> {
  const { target, action, reason, newDate } = input;
  const booking = target.booking;
  const ref = booking.id;
  const when =
    target.bookingType === "function_room"
      ? `${booking.date} · ${(booking as FunctionBooking).time}`
      : `${booking.date} · ${(booking as CateringBooking).time}`;
  const message =
    action === "cancel"
      ? `Customer requests cancellation of ${target.bookingType} booking ${ref} (${when}). Reason: ${reason}`
      : `Customer requests moving ${target.bookingType} booking ${ref} from ${when} to ${newDate}. Reason: ${reason}`;
  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      user_id: input.userId,
      name: input.customer,
      email: input.email,
      type: "Cancellation Request",
      message,
      status: "New",
    })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

export function subscribeReservationChanges(onChange: () => void) {
  return supabase
    .channel("operations-booking-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "function_bookings" },
      onChange,
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "catering_bookings" },
      onChange,
    )
    .subscribe();
}

export function pushTimeline(
  timeline: ReservationTimeline[] | undefined,
  nextStatus: ReservationStatus,
): ReservationTimeline[] {
  const t = [...(timeline ?? [])];
  t.push({ status: nextStatus, at: nowStamp() });
  return t;
}
