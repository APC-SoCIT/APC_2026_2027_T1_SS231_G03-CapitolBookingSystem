/** Website delivery orders, stored in Supabase `delivery_orders`.
 *
 * Replaces the previous browser-localStorage flow so orders follow the
 * customer across devices and are visible to staff. The reference code comes
 * from the collision-safe `next_delivery_reference()` sequence.
 */
import type { DeliveryOrder, OrderItem } from "./delivery";
import { supabase } from "../lib/supabase";

export type SupabaseDeliveryStatus =
  | "Pending Confirmation"
  | "Preparing"
  | "Ready for pickup"
  | "Out for delivery"
  | "Delivered"
  | "Cancelled";

export const SUPABASE_DELIVERY_STATUSES: SupabaseDeliveryStatus[] = [
  "Pending Confirmation",
  "Preparing",
  "Ready for pickup",
  "Out for delivery",
  "Delivered",
  "Cancelled",
];

export type SupabaseDeliveryOrder = {
  reference: string;
  customer: string;
  phone: string;
  address: string;
  itemsList: OrderItem[];
  itemsDisplay: string;
  status: SupabaseDeliveryStatus;
  eta: string;
  placedAt: string;
  paymentMethod: string;
  notes: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  timeline: { status: string; at: string }[];
  riderId?: string;
};

type DeliveryOrderRow = {
  reference: string;
  customer: string;
  phone: string | null;
  address: string;
  status: string;
  eta: string;
  placed_at: string;
  payment_method: string | null;
  notes: string | null;
  items_list: OrderItem[];
  items_display: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  timeline: { status: string; at: string }[] | null;
  rider_id: string | null;
};

function toOrder(row: DeliveryOrderRow): SupabaseDeliveryOrder {
  const placedAt = new Date(row.placed_at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return {
    reference: row.reference,
    customer: row.customer,
    phone: row.phone ?? "",
    address: row.address,
    itemsList: row.items_list ?? [],
    itemsDisplay: row.items_display ?? "",
    status: row.status as SupabaseDeliveryStatus,
    eta: row.eta,
    placedAt,
    paymentMethod: row.payment_method ?? "",
    notes: row.notes ?? "",
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    timeline: row.timeline?.length
      ? row.timeline
      : [{ status: row.status, at: placedAt }],
    riderId: row.rider_id ?? undefined,
  };
}

export async function createSupabaseDeliveryOrder(input: {
  userId: string;
  customer: string;
  phone: string;
  address: string;
  itemsList: OrderItem[];
  itemsDisplay: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  notes: string;
}): Promise<string> {
  const { data: refData, error: refError } = await supabase.rpc(
    "next_delivery_reference",
  );
  if (refError) throw refError;
  const reference = refData as string;
  const { error } = await supabase.from("delivery_orders").insert({
    reference,
    user_id: input.userId,
    customer: input.customer,
    phone: input.phone,
    address: input.address,
    status: "Pending Confirmation",
    eta: "To be confirmed",
    payment_method: input.paymentMethod,
    notes: input.notes,
    items_list: input.itemsList,
    items_display: input.itemsDisplay,
    subtotal: input.subtotal,
    delivery_fee: input.deliveryFee,
    total: input.total,
    timeline: [{ status: "Pending Confirmation", at: "Just now" }],
    source: "web",
  });
  if (error) throw error;
  return reference;
}

export async function fetchMyDeliveryOrders(): Promise<
  SupabaseDeliveryOrder[]
> {
  const { data, error } = await supabase
    .from("delivery_orders")
    .select(
      "reference, customer, phone, address, status, eta, placed_at, payment_method, notes, items_list, items_display, subtotal, delivery_fee, total, timeline, rider_id",
    )
    .order("placed_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as DeliveryOrderRow[]).map(toOrder);
}

export async function fetchDeliveryOrderByReference(
  reference: string,
): Promise<SupabaseDeliveryOrder | null> {
  const { data, error } = await supabase
    .from("delivery_orders")
    .select(
      "reference, customer, phone, address, status, eta, placed_at, payment_method, notes, items_list, items_display, subtotal, delivery_fee, total, timeline, rider_id",
    )
    .eq("reference", reference)
    .maybeSingle();
  if (error) throw error;
  return data ? toOrder(data as unknown as DeliveryOrderRow) : null;
}

export async function fetchAllDeliveryOrders(): Promise<
  SupabaseDeliveryOrder[]
> {
  return fetchMyDeliveryOrders();
}

export async function updateSupabaseDeliveryOrder(input: {
  reference: string;
  status?: SupabaseDeliveryStatus;
  riderId?: string | null;
  eta?: string;
  customer?: string;
  phone?: string;
  address?: string;
  itemsList?: OrderItem[];
  itemsDisplay?: string;
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
  paymentMethod?: string;
  notes?: string;
}): Promise<void> {
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (input.status) patch.status = input.status;
  if (input.riderId !== undefined) patch.rider_id = input.riderId;
  if (input.eta !== undefined) patch.eta = input.eta;
  if (input.customer !== undefined) patch.customer = input.customer;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.address !== undefined) patch.address = input.address;
  if (input.itemsList !== undefined) patch.items_list = input.itemsList;
  if (input.itemsDisplay !== undefined) patch.items_display = input.itemsDisplay;
  if (input.subtotal !== undefined) patch.subtotal = input.subtotal;
  if (input.deliveryFee !== undefined) patch.delivery_fee = input.deliveryFee;
  if (input.total !== undefined) patch.total = input.total;
  if (input.paymentMethod !== undefined) patch.payment_method = input.paymentMethod;
  if (input.notes !== undefined) patch.notes = input.notes;
  const { error } = await supabase
    .from("delivery_orders")
    .update(patch)
    .eq("reference", input.reference);
  if (error) throw error;
}

export function subscribeDeliveryOrders(onChange: () => void) {
  return supabase
    .channel("delivery-orders-changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "delivery_orders" },
      onChange,
    )
    .subscribe();
}

/** Website orders mapped onto the local order shape for staff screens. */
export function toLocalDeliveryOrder(order: SupabaseDeliveryOrder): DeliveryOrder {
  return {
    reference: order.reference,
    customer: order.customer,
    phone: order.phone,
    address: order.address,
    items: order.itemsDisplay,
    itemsList: order.itemsList,
    eta: order.eta,
    status: order.status,
    placedAt: order.placedAt,
    paymentMethod: order.paymentMethod,
    notes: order.notes,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    timeline: order.timeline.map((event) => ({
      status: event.status as DeliveryOrder["status"],
      at: event.at,
    })),
    riderId: order.riderId,
  };
}
