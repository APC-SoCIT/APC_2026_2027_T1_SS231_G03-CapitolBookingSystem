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
  location: { lat: 14.5447, lng: 121.003 },
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

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  categories?: string[];
  image?: string;
  /** Items sharing a variantGroup render as one product card with a picker (e.g. Half/Whole). */
  variantGroup?: string;
  /** Option label shown in the picker, e.g. "Half", "XS (3–5 pax)". */
  variantLabel?: string;
};

export const CATERING_PACKAGES: CateringPackage[] = serviceCatalog.cateringPackages;

export const CATERING_PACKAGE_NOTES: string[] = serviceCatalog.cateringPackageNotes;

export const PACKED_MENU_ITEMS: MenuItem[] = serviceCatalog.packedMenuItems;

/* Capitol menu board (2026 C1) — delivery-only menu. Catering keeps PACKED_MENU_ITEMS.
   Data lives in serviceCatalog.json so webhook.js (the Messenger agent) quotes the same menu. */
export const DELIVERY_MENU_ITEMS: MenuItem[] = serviceCatalog.deliveryMenuItems;

export const PACKED_MEAL_GUIDELINES = serviceCatalog.packedMealGuidelines;

export const DELIVERY_FEE: number = serviceCatalog.deliveryFee;

export const FUNCTION_ROOMS: { title: string; detail: string }[] = serviceCatalog.functionRooms;
export const FUNCTION_ROOM_AMENITIES: string[] = serviceCatalog.functionRoomAmenities;
export const FUNCTION_ROOM_EVENT_TYPES: string[] = serviceCatalog.functionRoomEventTypes;
