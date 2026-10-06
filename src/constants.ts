// Service data is shared with webhook.js (the Messenger agent) through this JSON file.
import serviceCatalog from "./data/serviceCatalog.json";

export type NavigationItem = { label: string; path: string };

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: "Catering", path: "/catering" },
  { label: "Function Rooms", path: "/function-rooms" },
  { label: "Delivery", path: "/delivery" },
];

export const RESTAURANT_INFO = {
  name: "Capitol",
  tagline: "Pasay City's Oldest Restaurant",
  since: "1940",
  phone: "8556-1313",
  email: "reservations@capitolrestaurant.com",
  address: "Pasay City, Metro Manila, Philippines",
};

export type CateringPackage = {
  id: string;
  name: string;
  packagePrice: number;
  /** Effective per-person price retained for existing admin records. */
  pricePerPax: number;
  minPax: number;
  maxPax: number;
  servingSize: string;
  description: string;
  inclusions: string[];
};

/** Dates already reserved — blocked in the booking calendar (YYYY-MM-DD). */
export const RESERVED_DATES: string[] = [
  "2026-08-19",
  "2026-08-22",
  "2026-08-28",
  "2026-09-03",
  "2026-09-10",
  "2026-09-15",
  "2026-09-20",
  "2026-09-25",
  "2026-10-04",
  "2026-10-11",
];
export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categories?: string[];
  image?: string;
};

export const CATERING_PACKAGES: CateringPackage[] = serviceCatalog.cateringPackages;

export const CATERING_PACKAGE_NOTES: string[] = serviceCatalog.cateringPackageNotes;

export const PACKED_MENU_ITEMS: MenuItem[] = serviceCatalog.packedMenuItems;

export const PACKED_MEAL_GUIDELINES = serviceCatalog.packedMealGuidelines;

export const DELIVERY_FEE: number = serviceCatalog.deliveryFee;

export const FUNCTION_ROOMS: { title: string; detail: string }[] = serviceCatalog.functionRooms;
export const FUNCTION_ROOM_AMENITIES: string[] = serviceCatalog.functionRoomAmenities;
export const FUNCTION_ROOM_EVENT_TYPES: string[] = serviceCatalog.functionRoomEventTypes;
