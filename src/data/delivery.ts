export type DeliveryStatus =
  | "Preparing"
  | "Ready for pickup"
  | "Out for delivery"
  | "Delivered";

export type OrderItemType = "package" | "packed_meal";

export type OrderItem = {
  id: string;
  type: OrderItemType;
  name: string;
  quantity: number;
  price: number;
  pax?: number;
  category?: string;
};

export type TimelineEvent = {
  status: DeliveryStatus;
  at: string;
};

export type DeliveryOrder = {
  reference: string;
  customer: string;
  phone?: string;
  address: string;
  items: string;
  itemsList?: OrderItem[];
  eta: string;
  status: DeliveryStatus;
  placedAt: string;
  paymentMethod?: string;
  notes?: string;
  subtotal?: number;
  deliveryFee?: number;
  total?: number;
  timeline?: TimelineEvent[];
};

export const DELIVERY_STATUSES: DeliveryStatus[] = [
  "Preparing",
  "Ready for pickup",
  "Out for delivery",
  "Delivered",
];

const DEFAULT_DELIVERY_FEE = 60;

function buildItemsDisplay(items: OrderItem[]): string {
  if (!items.length) return "No items";
  if (items.length === 1) {
    const it = items[0];
    if (it.type === "package") {
      return `${it.name} · ${it.pax ?? 50} pax${it.quantity > 1 ? ` ×${it.quantity}` : ""}`;
    }
    return `${it.name} · ${it.quantity} orders`;
  }
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  return `${items.length} items · ${totalQty} orders`;
}

function calcTotals(items: OrderItem[], deliveryFee = DEFAULT_DELIVERY_FEE) {
  const subtotal = items.reduce((sum, it) => {
    if (it.type === "package") {
      return sum + it.price * (it.pax ?? 50) * it.quantity;
    }
    return sum + it.price * it.quantity;
  }, 0);
  const fee = subtotal > 0 ? deliveryFee : 0;
  return { subtotal, deliveryFee: fee, total: subtotal + fee };
}

export const INITIAL_ORDERS: DeliveryOrder[] = [
  {
    reference: "CAP-1042",
    customer: "Maria Santos",
    phone: "0917 123 4567",
    address: "Pasay City, Metro Manila",
    items: "Package 2 · 50 pax",
    itemsList: [
      { id: "pkg-2", type: "package", name: "Package 2", quantity: 1, price: 500, pax: 50 },
    ],
    eta: "Today, 6:30 PM",
    status: "Out for delivery",
    placedAt: "Today, 2:15 PM",
    paymentMethod: "Cash on delivery",
    notes: "",
    ...calcTotals([{ id: "pkg-2", type: "package", name: "Package 2", quantity: 1, price: 500, pax: 50 }]),
    timeline: [
      { status: "Preparing", at: "Today, 2:15 PM" },
      { status: "Ready for pickup", at: "Today, 4:00 PM" },
      { status: "Out for delivery", at: "Today, 5:10 PM" },
    ],
  },
  {
    reference: "CAP-1043",
    customer: "Juan dela Cruz",
    phone: "0918 987 6543",
    address: "Makati City, Metro Manila",
    items: "Packed meals · 25 orders",
    itemsList: [
      { id: "pm-01", type: "packed_meal", name: "Adobong Manok", quantity: 10, price: 120, category: "Chicken" },
      { id: "pm-02", type: "packed_meal", name: "Lechon Kawali", quantity: 8, price: 145, category: "Pork" },
      { id: "pm-09", type: "packed_meal", name: "Steamed Rice", quantity: 7, price: 35, category: "Sides" },
    ],
    eta: "Tomorrow, 11:45 AM",
    status: "Preparing",
    placedAt: "Today, 3:40 PM",
    paymentMethod: "GCash",
    notes: "Extra utensils please",
    ...calcTotals([
      { id: "pm-01", type: "packed_meal", name: "Adobong Manok", quantity: 10, price: 120, category: "Chicken" },
      { id: "pm-02", type: "packed_meal", name: "Lechon Kawali", quantity: 8, price: 145, category: "Pork" },
      { id: "pm-09", type: "packed_meal", name: "Steamed Rice", quantity: 7, price: 35, category: "Sides" },
    ]),
    timeline: [{ status: "Preparing", at: "Today, 3:40 PM" }],
  },
  {
    reference: "CAP-1044",
    customer: "Ana Reyes",
    phone: "0920 555 0199",
    address: "Pasay City, Metro Manila",
    items: "Package 1 · 50 pax",
    itemsList: [
      { id: "pkg-1", type: "package", name: "Package 1", quantity: 1, price: 350, pax: 50 },
    ],
    eta: "Yesterday, 7:00 PM",
    status: "Delivered",
    placedAt: "Yesterday, 1:05 PM",
    paymentMethod: "Cash on delivery",
    notes: "",
    ...calcTotals([{ id: "pkg-1", type: "package", name: "Package 1", quantity: 1, price: 350, pax: 50 }]),
    timeline: [
      { status: "Preparing", at: "Yesterday, 1:05 PM" },
      { status: "Ready for pickup", at: "Yesterday, 3:00 PM" },
      { status: "Out for delivery", at: "Yesterday, 4:30 PM" },
      { status: "Delivered", at: "Yesterday, 7:00 PM" },
    ],
  },
];

const STORAGE_KEY = "capitol-delivery-orders";

function normalizeOrders(orders: DeliveryOrder[]): DeliveryOrder[] {
  return orders.map((o) => {
    const itemsList = o.itemsList ?? [];
    // if legacy order with no itemsList, keep as is but ensure timeline
    const timeline = o.timeline ?? [{ status: o.status, at: o.placedAt }];
    let subtotal = o.subtotal;
    let deliveryFee = o.deliveryFee;
    let total = o.total;
    if (itemsList.length && (subtotal === undefined || total === undefined)) {
      const t = calcTotals(itemsList, deliveryFee);
      subtotal = t.subtotal;
      deliveryFee = t.deliveryFee;
      total = t.total;
    }
    return { ...o, itemsList, timeline, subtotal, deliveryFee, total };
  });
}

export function getDeliveryOrders(): DeliveryOrder[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return INITIAL_ORDERS;
  try {
    const parsed = JSON.parse(stored) as DeliveryOrder[];
    return normalizeOrders(parsed);
  } catch {
    return INITIAL_ORDERS;
  }
}

export function saveDeliveryOrders(orders: DeliveryOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}

export function resetDeliveryOrders() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getDeliveryOrder(reference: string): DeliveryOrder | undefined {
  return getDeliveryOrders().find((o) => o.reference === reference);
}

export function saveDeliveryOrder(updated: DeliveryOrder) {
  const orders = getDeliveryOrders();
  const idx = orders.findIndex((o) => o.reference === updated.reference);
  if (idx >= 0) orders[idx] = updated;
  else orders.push(updated);
  saveDeliveryOrders(orders);
}

export function updateOrderWithHistory(
  order: DeliveryOrder,
  patch: Partial<DeliveryOrder>,
  nextStatus?: DeliveryStatus,
): DeliveryOrder {
  const now = new Date().toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const timeline = [...(order.timeline ?? [])];
  if (nextStatus && nextStatus !== order.status) {
    timeline.push({ status: nextStatus, at: now });
  }
  const merged: DeliveryOrder = { ...order, ...patch, timeline };
  if (nextStatus) merged.status = nextStatus;
  // recalc display string and totals if itemsList changed
  if (patch.itemsList) {
    merged.items = buildItemsDisplay(patch.itemsList);
    const t = calcTotals(patch.itemsList, patch.deliveryFee ?? order.deliveryFee ?? DEFAULT_DELIVERY_FEE);
    merged.subtotal = t.subtotal;
    merged.deliveryFee = t.deliveryFee;
    merged.total = t.total;
  }
  return merged;
}

export function calculateOrderTotals(itemsList: OrderItem[], deliveryFee?: number) {
  return calcTotals(itemsList, deliveryFee);
}

export function formatItemsDisplay(itemsList: OrderItem[]): string {
  return buildItemsDisplay(itemsList);
}
