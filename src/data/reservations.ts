import type { OrderItem } from "./delivery";

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
