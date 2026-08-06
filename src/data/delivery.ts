export type DeliveryStatus =
  "Preparing" | "Ready for pickup" | "Out for delivery" | "Delivered";

export type DeliveryOrder = {
  reference: string;
  customer: string;
  address: string;
  items: string;
  eta: string;
  status: DeliveryStatus;
  placedAt: string;
};

export const DELIVERY_STATUSES: DeliveryStatus[] = [
  "Preparing",
  "Ready for pickup",
  "Out for delivery",
  "Delivered",
];

export const DEMO_ORDERS: DeliveryOrder[] = [
  {
    reference: "CAP-1042",
    customer: "Maria Santos",
    address: "Pasay City, Metro Manila",
    items: "Package 2 · 50 pax",
    eta: "Today, 6:30 PM",
    status: "Out for delivery",
    placedAt: "Today, 2:15 PM",
  },
  {
    reference: "CAP-1043",
    customer: "Juan dela Cruz",
    address: "Makati City, Metro Manila",
    items: "Packed meals · 25 orders",
    eta: "Tomorrow, 11:45 AM",
    status: "Preparing",
    placedAt: "Today, 3:40 PM",
  },
  {
    reference: "CAP-1044",
    customer: "Ana Reyes",
    address: "Pasay City, Metro Manila",
    items: "Package 1 · 50 pax",
    eta: "Yesterday, 7:00 PM",
    status: "Delivered",
    placedAt: "Yesterday, 1:05 PM",
  },
];

const STORAGE_KEY = "capitol-demo-delivery-orders";

export function getDeliveryOrders(): DeliveryOrder[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEMO_ORDERS;
  try {
    return JSON.parse(stored) as DeliveryOrder[];
  } catch {
    return DEMO_ORDERS;
  }
}

export function saveDeliveryOrders(orders: DeliveryOrder[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
}
