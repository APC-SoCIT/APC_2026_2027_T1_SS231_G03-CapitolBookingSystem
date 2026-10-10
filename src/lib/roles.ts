export type UserRole =
  | "customer"
  | "front_of_house"
  | "restaurant_manager"
  | "system_admin"
  | "delivery_rider";

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Customer",
  front_of_house: "Front-of-House Staff",
  restaurant_manager: "Restaurant Manager",
  system_admin: "System Admin",
  delivery_rider: "Delivery Rider",
};

const ROLE_HOMES: Record<UserRole, string> = {
  customer: "/",
  front_of_house: "/operations",
  restaurant_manager: "/operations",
  system_admin: "/delivery/staff",
  delivery_rider: "/delivery/rider",
};

const CUSTOMER_PATHS = [
  "/",
  "/about",
  "/catering",
  "/catering/buffet",
  "/catering/packed",
  "/function-rooms",
  "/function-rooms/reserve",
  "/inquiries",
  "/delivery",
  "/delivery/order",
  "/profile",
];

const OPERATIONS_PATHS = [
  "/operations",
  "/delivery/staff",
  "/delivery/items",
  "/inquiry-bot",
];

type RoleAccount = { role: unknown } | null;

export function isUserRole(role: unknown): role is UserRole {
  return typeof role === "string" && Object.prototype.hasOwnProperty.call(ROLE_LABELS, role);
}

export function getRoleHome(role: unknown): string | null {
  return isUserRole(role) ? ROLE_HOMES[role] : null;
}

export function canAccessCustomerPages(account: RoleAccount): boolean {
  return account === null || account.role === "customer";
}

export function canAccessRoute(account: RoleAccount, pathname: string): boolean {
  const path = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  if (canAccessCustomerPages(account)) return CUSTOMER_PATHS.includes(path);

  switch (account?.role) {
    case "front_of_house":
      return OPERATIONS_PATHS.includes(path);
    case "restaurant_manager":
      return OPERATIONS_PATHS.includes(path) || path === "/dashboard";
    case "system_admin":
      return OPERATIONS_PATHS.includes(path) || path === "/dashboard" || path === "/delivery/rider";
    case "delivery_rider":
      return path === "/delivery/rider";
    default:
      return false;
  }
}
