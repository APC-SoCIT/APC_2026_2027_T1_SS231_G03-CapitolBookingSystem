import { supabase } from "../lib/supabase";

export type StaffNotificationKind = "delivery" | "reservation" | "inquiry";

export type StaffNotification = {
  id: string;
  kind: StaffNotificationKind;
  title: string;
  detail: string;
  path: string;
  createdAt: string;
};

/** Staff screen that handles each kind of notification. */
export const NOTIFICATION_PATHS: Record<StaffNotificationKind, string> = {
  delivery: "/delivery/staff",
  reservation: "/operations",
  inquiry: "/inquiry-bot",
};

// Inquiry Bot only lists inquiries that came in through Messenger.
const MESSENGER_EMAIL_PATTERN = "messenger%@placeholder.com";
const PER_SOURCE_LIMIT = 10;
const MAX_NOTIFICATIONS = 25;

const peso = (amount: number) => `₱${Number(amount).toLocaleString()}`;

/** Latest orders, reservations and Messenger inquiries, newest first. */
export async function fetchStaffNotifications(
  kinds: StaffNotificationKind[],
): Promise<StaffNotification[]> {
  const requests: Promise<StaffNotification[]>[] = [];

  if (kinds.includes("delivery")) {
    requests.push(
      (async () => {
        const { data, error } = await supabase
          .from("delivery_orders")
          .select("reference, customer, total, created_at")
          .order("created_at", { ascending: false })
          .limit(PER_SOURCE_LIMIT);
        if (error) throw error;
        return (data ?? []).map((row) => ({
          id: `delivery:${row.reference}`,
          kind: "delivery" as const,
          title: "New delivery order",
          detail: `${row.customer} · ${peso(row.total)} · ${row.reference}`,
          path: NOTIFICATION_PATHS.delivery,
          createdAt: row.created_at,
        }));
      })(),
    );
  }

  if (kinds.includes("reservation")) {
    requests.push(
      (async () => {
        const { data, error } = await supabase
          .from("function_bookings")
          .select("id, customer, guests, event_type, date, created_at")
          .order("created_at", { ascending: false })
          .limit(PER_SOURCE_LIMIT);
        if (error) throw error;
        return (data ?? []).map((row) => ({
          id: `function:${row.id}`,
          kind: "reservation" as const,
          title: "New function room reservation",
          detail: `${row.customer} · ${row.event_type} · ${row.guests} guests · ${row.date}`,
          path: NOTIFICATION_PATHS.reservation,
          createdAt: row.created_at,
        }));
      })(),
      (async () => {
        const { data, error } = await supabase
          .from("catering_bookings")
          .select("id, kind, customer, date, created_at")
          .order("created_at", { ascending: false })
          .limit(PER_SOURCE_LIMIT);
        if (error) throw error;
        return (data ?? []).map((row) => ({
          id: `catering:${row.id}`,
          kind: "reservation" as const,
          title:
            row.kind === "catering_buffet"
              ? "New buffet catering reservation"
              : "New packed meals reservation",
          detail: `${row.customer} · ${row.date}`,
          path: NOTIFICATION_PATHS.reservation,
          createdAt: row.created_at,
        }));
      })(),
    );
  }

  if (kinds.includes("inquiry")) {
    requests.push(
      (async () => {
        const { data, error } = await supabase
          .from("inquiries")
          .select("id, name, type, created_at")
          .like("email", MESSENGER_EMAIL_PATTERN)
          .order("created_at", { ascending: false })
          .limit(PER_SOURCE_LIMIT);
        if (error) throw error;
        return (data ?? []).map((row) => ({
          id: `inquiry:${row.id}`,
          kind: "inquiry" as const,
          title: `New ${row.type.toLowerCase()} via Messenger`,
          detail: row.name,
          path: NOTIFICATION_PATHS.inquiry,
          createdAt: row.created_at,
        }));
      })(),
    );
  }

  const groups = await Promise.all(requests);
  return groups
    .flat()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, MAX_NOTIFICATIONS);
}

/** Fires on any new order or reservation. Inquiries are not in the realtime
 * publication, so callers poll for those instead. */
export function subscribeStaffNotifications(onInsert: () => void) {
  return supabase
    .channel("staff-notifications")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "delivery_orders" }, onInsert)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "function_bookings" }, onInsert)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "catering_bookings" }, onInsert)
    .subscribe();
}
