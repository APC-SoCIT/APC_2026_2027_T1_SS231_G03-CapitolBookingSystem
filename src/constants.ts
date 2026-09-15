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
    name: "Adobong Manok",
    description: "Classic Filipino chicken adobo in garlic, soy, and vinegar.",
    price: 120,
    category: "Solo Meals",
    categories: ["Solo Meals", "Chicken"],
  },
  {
    id: "pm-02",
    name: "Lechon Kawali",
    description: "Crispy deep-fried pork belly served with liver sauce.",
    price: 145,
    category: "Solo Meals",
    categories: ["Solo Meals", "Pork"],
  },
  {
    id: "pm-03",
    name: "Pork Sinigang",
    description: "Tamarind-based pork soup with fresh vegetables.",
    price: 135,
    category: "Solo Meals",
    categories: ["Solo Meals", "Pork"],
  },
  {
    id: "pm-04",
    name: "Beef Kaldereta",
    description: "Braised beef in tomato and liver sauce with bell peppers.",
    price: 165,
    category: "Solo Meals",
    categories: ["Solo Meals", "Beef"],
  },
  {
    id: "pm-05",
    name: "Chicken Tinola",
    description:
      "Ginger-based chicken soup with green papaya and chili leaves.",
    price: 115,
    category: "Solo Meals",
    categories: ["Solo Meals", "Chicken"],
  },
  {
    id: "pm-06",
    name: "Pinakbet",
    description: "Mixed vegetables sautéed with shrimp paste and pork.",
    price: 100,
    category: "Solo Meals",
    categories: ["Solo Meals", "Vegetables"],
  },
  {
    id: "pm-07",
    name: "Laing",
    description: "Taro leaves simmered in coconut milk with chili.",
    price: 95,
    category: "Solo Meals",
    categories: ["Solo Meals", "Vegetables"],
  },
  {
    id: "pm-08",
    name: "Pancit Bihon",
    description:
      "Stir-fried rice noodles with pork, vegetables, and soy sauce.",
    price: 110,
    category: "Solo Meals",
    categories: ["Solo Meals", "Pasta & Noodles"],
  },
  {
    id: "pm-09",
    name: "Steamed Rice",
    description: "Freshly cooked premium white rice per serving.",
    price: 35,
    category: "Sides",
    categories: ["Sides"],
  },
  {
    id: "pm-10",
    name: "Leche Flan",
    description: "Classic Filipino caramel custard dessert.",
    price: 75,
    category: "Desserts",
    categories: ["Desserts"],
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
