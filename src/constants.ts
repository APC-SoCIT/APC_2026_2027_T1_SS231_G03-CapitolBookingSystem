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
};

export const CATERING_PACKAGES: CateringPackage[] = [
  {
    id: "pkg-1",
    name: "Package A",
    packagePrice: 2850,
    pricePerPax: 285,
    minPax: 10,
    maxPax: 12,
    servingSize: "Good for 10 to 12 persons",
    description: "A set menu for baptisms and other occasions.",
    inclusions: [
      "Capitol Chicken",
      "Lumpiang Shanghai",
      "Chopsuey",
      "Sweet & Sour Fish Fillet",
      "Pancit (MikiBihon, Bihon, Canton, or Chami)",
      "Nido Soup",
      "2 Fried Rice Platters or 12 cups Plain Rice",
      "2 XL Soft Drinks",
    ],
  },
  {
    id: "pkg-2",
    name: "Package B",
    packagePrice: 3150,
    pricePerPax: 315,
    minPax: 10,
    maxPax: 12,
    servingSize: "Good for 10 to 12 persons",
    description: "A fuller set menu for baptisms and other occasions.",
    inclusions: [
      "Buttered Chicken",
      "Chopsuey",
      "Beef Broccoli",
      "Sweet and Sour Fish (Pla-Pla)",
      "Pancit (MikiBihon, Bihon, Canton, or Chami)",
      "Nido Soup",
      "2 Fried Rice Platters or 12 cups Plain Rice",
      "Crispy Pata",
      "2 XL Soft Drinks",
    ],
  },
  {
    id: "pkg-3",
    name: "Package C",
    packagePrice: 3450,
    pricePerPax: 345,
    minPax: 10,
    maxPax: 12,
    servingSize: "Good for 10 to 12 persons",
    description: "The most complete set menu for special occasions.",
    inclusions: [
      "Buttered Chicken",
      "Chopsuey",
      "Beef Broccoli",
      "Sweet and Sour Fish (Pla-Pla)",
      "Pancit (MikiBihon, Bihon, Canton, or Chami)",
      "Sinigang Hipon / Baboy",
      "2 Fried Rice Platters or 12 cups Plain Rice",
      "Crispy Ulo",
      "2 XL Soft Drinks",
    ],
  },
];

export const CATERING_PACKAGE_NOTES = [
  "Pancit choices: MikiBihon, Bihon, Canton, or Chami.",
  "Rice choices: 12 cups of Plain Rice or 2 Fried Rice Platters.",
];

export const PACKED_MENU_ITEMS: MenuItem[] = [
  {
    id: "pm-01",
    name: "Buttered Chicken",
    description: "Solo meal with 1 cup steamed rice.",
    price: 100,
    category: "Solo meals",
  },
  {
    id: "pm-02",
    name: "Capitol Chicken",
    description: "Solo meal with 1 cup steamed rice.",
    price: 100,
    category: "Solo meals",
  },
  {
    id: "pm-03",
    name: "Sizzling Chicken",
    description: "Solo meal with 1 cup steamed rice.",
    price: 100,
    category: "Solo meals",
  },
  {
    id: "pm-04",
    name: "Chicken Pork Adobo",
    description: "Solo meal with 1 cup steamed rice.",
    price: 100,
    category: "Solo meals",
  },
  {
    id: "pm-05",
    name: "Lumpiang Shanghai",
    description: "Solo meal with 1 cup steamed rice.",
    price: 100,
    category: "Solo meals",
  },
  {
    id: "pm-06",
    name: "Sweet & Sour Pork",
    description: "Solo meal with 1 cup steamed rice.",
    price: 100,
    category: "Solo meals",
  },
  {
    id: "pm-07",
    name: "Capitol Pork Chop",
    description: "Solo meal with 1 cup steamed rice.",
    price: 100,
    category: "Solo meals",
  },
  {
    id: "pm-08",
    name: "Fried Fish Fillet",
    description: "Solo meal with 1 cup steamed rice.",
    price: 100,
    category: "Solo meals",
  },
  {
    id: "pm-09",
    name: "Sweet & Sour Fish",
    description: "Solo meal with 1 cup steamed rice.",
    price: 100,
    category: "Solo meals",
  },
  {
    id: "pm-10",
    name: "Fish Tofu",
    description: "Solo meal with 1 cup steamed rice.",
    price: 100,
    category: "Solo meals",
  },
  {
    id: "pm-11",
    name: "Chopsuey Rice",
    description: "Solo meal with 1 cup steamed rice.",
    price: 100,
    category: "Solo meals",
  },
  {
    id: "pm-12",
    name: "Gising Rice",
    description: "Solo meal with 1 cup steamed rice.",
    price: 100,
    category: "Solo meals",
  },
  {
    id: "pm-13",
    name: "Beef Tapa",
    description: "Solo meal with 1 cup steamed rice.",
    price: 100,
    category: "Solo meals",
  },
  {
    id: "pm-14",
    name: "Beef Brisket",
    description: "Solo meal with 1 cup steamed rice.",
    price: 100,
    category: "Solo meals",
  },
  {
    id: "pm-15",
    name: "Chicken + Pancit + Rice",
    description: "Chicken with pancit and rice.",
    price: 125,
    category: "1 ulam & pancit",
  },
  {
    id: "pm-16",
    name: "Pork + Pancit + Rice",
    description: "Pork with pancit and rice.",
    price: 125,
    category: "1 ulam & pancit",
  },
  {
    id: "pm-17",
    name: "Fish + Pancit + Rice",
    description: "Fish with pancit and rice.",
    price: 125,
    category: "1 ulam & pancit",
  },
  {
    id: "pm-18",
    name: "Chicken + Vegetable + Rice",
    description: "Chicken with a vegetable side and rice.",
    price: 125,
    category: "1 ulam & vegetable",
  },
  {
    id: "pm-19",
    name: "Pork + Vegetable + Rice",
    description: "Pork with a vegetable side and rice.",
    price: 125,
    category: "1 ulam & vegetable",
  },
  {
    id: "pm-20",
    name: "Fish + Vegetable + Rice",
    description: "Fish with a vegetable side and rice.",
    price: 125,
    category: "1 ulam & vegetable",
  },
  {
    id: "pm-21",
    name: "Buttered Chicken + Lumpiang Shanghai + Rice",
    description: "Two ulam selections with rice.",
    price: 150,
    category: "2 ulam",
  },
  {
    id: "pm-22",
    name: "Capitol Chicken + Lumpiang Shanghai + Rice",
    description: "Two ulam selections with rice.",
    price: 150,
    category: "2 ulam",
  },
  {
    id: "pm-23",
    name: "Buttered Chicken + Sweet & Sour Fish + Rice",
    description: "Two ulam selections with rice.",
    price: 150,
    category: "2 ulam",
  },
  {
    id: "pm-24",
    name: "Sweet & Sour Pork + Fish Tofu + Rice",
    description: "Two ulam selections with rice.",
    price: 150,
    category: "2 ulam",
  },
  {
    id: "pm-25",
    name: "Capitol Porkchop + Fried Fish Fillet + Rice",
    description: "Two ulam selections with rice.",
    price: 150,
    category: "2 ulam",
  },
  {
    id: "pm-26",
    name: "Beef Brisket + Chopsuey + Rice",
    description: "Two ulam selections with rice.",
    price: 150,
    category: "2 ulam",
  },
];

export const PACKED_MEAL_GUIDELINES = {
  intro: "Ideal for crew meals, events, office parties, and meetings.",
  minimumOrder: "Minimum order: 10 packs per delivery and 10 packs per kind.",
  advanceOrder: "Advance order required.",
  bulkOrder: "Orders of 100 or more packs should be placed at least 2 days before the intended date.",
  landline: "8556-1313",
  mobile: "09175141300",
} as const;
