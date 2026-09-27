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

/* Capitol menu board (2026 C1) — delivery-only menu. Catering keeps PACKED_MENU_ITEMS. */
export const DELIVERY_MENU_ITEMS: MenuItem[] = [
  // ——— Pancit / Noodles — regular order, good for 2–3 pax ———
  { id: "pm-11", name: "MikiBihon", description: "Stir-fried miki and bihon noodles. Good for 2–3 pax.", price: 170, category: "Pancit / Noodles", categories: ["Pancit / Noodles"] },
  { id: "pm-12", name: "Bihon", description: "Classic rice noodles, sautéed with vegetables and meat. Good for 2–3 pax.", price: 170, category: "Pancit / Noodles", categories: ["Pancit / Noodles"] },
  { id: "pm-13", name: "Chami", description: "Sweet-savory thick egg noodles. Good for 2–3 pax.", price: 170, category: "Pancit / Noodles", categories: ["Pancit / Noodles"] },
  { id: "pm-14", name: "Canton", description: "Stir-fried wheat noodles. Good for 2–3 pax.", price: 170, category: "Pancit / Noodles", categories: ["Pancit / Noodles"] },
  { id: "pm-15", name: "Lomi", description: "Thick egg noodle soup in savory broth. Good for 2–3 pax.", price: 170, category: "Pancit / Noodles", categories: ["Pancit / Noodles"] },
  { id: "pm-16", name: "Alanganin", description: "House-style pancit with mixed toppings. Good for 2–3 pax.", price: 170, category: "Pancit / Noodles", categories: ["Pancit / Noodles"] },
  { id: "pm-17", name: "PataBihon", description: "Bihon noodles with tender pork pata. Good for 2–3 pax.", price: 200, category: "Pancit / Noodles", categories: ["Pancit / Noodles"] },
  { id: "pm-18", name: "Canton-Bihon", description: "Combo of canton and bihon noodles. Good for 2–3 pax.", price: 200, category: "Pancit / Noodles", categories: ["Pancit / Noodles"] },
  { id: "pm-19", name: "Sotanghon", description: "Glass noodles sautéed with chicken and vegetables. Good for 2–3 pax.", price: 200, category: "Pancit / Noodles", categories: ["Pancit / Noodles"] },
  { id: "pm-20", name: "Palabok (Luglog)", description: "Rice noodles in rich shrimp sauce with toppings. Good for 2–3 pax.", price: 200, category: "Pancit / Noodles", categories: ["Pancit / Noodles"] },
  { id: "pm-21", name: "Chopsuey Noodles", description: "Chopsuey served over noodles. Good for 2–3 pax.", price: 200, category: "Pancit / Noodles", categories: ["Pancit / Noodles"] },
  { id: "pm-22", name: "Bihon Tostado", description: "Crispy-fried bihon with savory topping. Good for 2–3 pax.", price: 200, category: "Pancit / Noodles", categories: ["Pancit / Noodles"] },
  { id: "pm-23", name: "Maki-Mi", description: "Classic maki-mi noodle dish. Good for 2–3 pax.", price: 200, category: "Pancit / Noodles", categories: ["Pancit / Noodles"] },
  { id: "pm-24", name: "Canton Puti", description: "White canton noodles, house recipe. Good for 2–3 pax.", price: 200, category: "Pancit / Noodles", categories: ["Pancit / Noodles"] },
  { id: "pm-25", name: "Pancit Sisig", description: "Pancit topped with sizzling sisig. Good for 2–3 pax.", price: 220, category: "Pancit / Noodles", categories: ["Pancit / Noodles"] },

  // ——— Pancit sa Bilao (tray sizes) ———
  { id: "pm-26", name: "MikiBihon Bilao (XS)", description: "Tray good for 3–5 pax.", price: 430, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "MikiBihon Bilao", variantLabel: "XS (3–5 pax)" },
  { id: "pm-27", name: "MikiBihon Bilao (Small)", description: "Tray good for 8–10 pax.", price: 580, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "MikiBihon Bilao", variantLabel: "Small (8–10 pax)" },
  { id: "pm-28", name: "MikiBihon Bilao (Med)", description: "Tray good for 12–15 pax.", price: 780, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "MikiBihon Bilao", variantLabel: "Med (12–15 pax)" },
  { id: "pm-29", name: "MikiBihon Bilao (Large)", description: "Tray good for 18–20 pax.", price: 950, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "MikiBihon Bilao", variantLabel: "Large (18–20 pax)" },
  { id: "pm-30", name: "Bihon Bilao (XS)", description: "Tray good for 3–5 pax.", price: 430, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Bihon Bilao", variantLabel: "XS (3–5 pax)" },
  { id: "pm-31", name: "Bihon Bilao (Small)", description: "Tray good for 8–10 pax.", price: 580, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Bihon Bilao", variantLabel: "Small (8–10 pax)" },
  { id: "pm-32", name: "Bihon Bilao (Med)", description: "Tray good for 12–15 pax.", price: 780, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Bihon Bilao", variantLabel: "Med (12–15 pax)" },
  { id: "pm-33", name: "Bihon Bilao (Large)", description: "Tray good for 18–20 pax.", price: 950, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Bihon Bilao", variantLabel: "Large (18–20 pax)" },
  { id: "pm-34", name: "Chami Bilao (XS)", description: "Tray good for 3–5 pax.", price: 430, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Chami Bilao", variantLabel: "XS (3–5 pax)" },
  { id: "pm-35", name: "Chami Bilao (Small)", description: "Tray good for 8–10 pax.", price: 580, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Chami Bilao", variantLabel: "Small (8–10 pax)" },
  { id: "pm-36", name: "Chami Bilao (Med)", description: "Tray good for 12–15 pax.", price: 780, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Chami Bilao", variantLabel: "Med (12–15 pax)" },
  { id: "pm-37", name: "Chami Bilao (Large)", description: "Tray good for 18–20 pax.", price: 950, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Chami Bilao", variantLabel: "Large (18–20 pax)" },
  { id: "pm-38", name: "Canton Bilao (XS)", description: "Tray good for 3–5 pax.", price: 430, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Canton Bilao", variantLabel: "XS (3–5 pax)" },
  { id: "pm-39", name: "Canton Bilao (Small)", description: "Tray good for 8–10 pax.", price: 580, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Canton Bilao", variantLabel: "Small (8–10 pax)" },
  { id: "pm-40", name: "Canton Bilao (Med)", description: "Tray good for 12–15 pax.", price: 780, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Canton Bilao", variantLabel: "Med (12–15 pax)" },
  { id: "pm-41", name: "Canton Bilao (Large)", description: "Tray good for 18–20 pax.", price: 950, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Canton Bilao", variantLabel: "Large (18–20 pax)" },
  { id: "pm-42", name: "PataBihon Bilao (XS)", description: "Tray good for 3–5 pax.", price: 430, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "PataBihon Bilao", variantLabel: "XS (3–5 pax)" },
  { id: "pm-43", name: "PataBihon Bilao (Small)", description: "Tray good for 8–10 pax.", price: 580, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "PataBihon Bilao", variantLabel: "Small (8–10 pax)" },
  { id: "pm-44", name: "PataBihon Bilao (Med)", description: "Tray good for 12–15 pax.", price: 780, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "PataBihon Bilao", variantLabel: "Med (12–15 pax)" },
  { id: "pm-45", name: "PataBihon Bilao (Large)", description: "Tray good for 18–20 pax.", price: 950, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "PataBihon Bilao", variantLabel: "Large (18–20 pax)" },
  { id: "pm-46", name: "Canton-Bihon Bilao (XS)", description: "Tray good for 3–5 pax.", price: 430, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Canton-Bihon Bilao", variantLabel: "XS (3–5 pax)" },
  { id: "pm-47", name: "Canton-Bihon Bilao (Small)", description: "Tray good for 8–10 pax.", price: 580, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Canton-Bihon Bilao", variantLabel: "Small (8–10 pax)" },
  { id: "pm-48", name: "Canton-Bihon Bilao (Med)", description: "Tray good for 12–15 pax.", price: 780, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Canton-Bihon Bilao", variantLabel: "Med (12–15 pax)" },
  { id: "pm-49", name: "Canton-Bihon Bilao (Large)", description: "Tray good for 18–20 pax.", price: 950, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Canton-Bihon Bilao", variantLabel: "Large (18–20 pax)" },
  { id: "pm-50", name: "Sotanghon Bilao (XS)", description: "Tray good for 3–5 pax.", price: 430, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Sotanghon Bilao", variantLabel: "XS (3–5 pax)" },
  { id: "pm-51", name: "Sotanghon Bilao (Small)", description: "Tray good for 8–10 pax.", price: 580, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Sotanghon Bilao", variantLabel: "Small (8–10 pax)" },
  { id: "pm-52", name: "Sotanghon Bilao (Med)", description: "Tray good for 12–15 pax.", price: 880, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Sotanghon Bilao", variantLabel: "Med (12–15 pax)" },
  { id: "pm-53", name: "Sotanghon Bilao (Large)", description: "Tray good for 18–20 pax.", price: 950, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Sotanghon Bilao", variantLabel: "Large (18–20 pax)" },
  { id: "pm-54", name: "Palabok (Luglog) Bilao (XS)", description: "Tray good for 3–5 pax.", price: 530, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Palabok (Luglog) Bilao", variantLabel: "XS (3–5 pax)" },
  { id: "pm-55", name: "Palabok (Luglog) Bilao (Small)", description: "Tray good for 8–10 pax.", price: 680, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Palabok (Luglog) Bilao", variantLabel: "Small (8–10 pax)" },
  { id: "pm-56", name: "Palabok (Luglog) Bilao (Med)", description: "Tray good for 12–15 pax.", price: 880, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Palabok (Luglog) Bilao", variantLabel: "Med (12–15 pax)" },
  { id: "pm-57", name: "Palabok (Luglog) Bilao (Large)", description: "Tray good for 18–20 pax.", price: 1050, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Palabok (Luglog) Bilao", variantLabel: "Large (18–20 pax)" },
  { id: "pm-58", name: "Chopsuey Noodles Bilao (XS)", description: "Tray good for 3–5 pax.", price: 530, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Chopsuey Noodles Bilao", variantLabel: "XS (3–5 pax)" },
  { id: "pm-59", name: "Chopsuey Noodles Bilao (Small)", description: "Tray good for 8–10 pax.", price: 680, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Chopsuey Noodles Bilao", variantLabel: "Small (8–10 pax)" },
  { id: "pm-60", name: "Chopsuey Noodles Bilao (Med)", description: "Tray good for 12–15 pax.", price: 880, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Chopsuey Noodles Bilao", variantLabel: "Med (12–15 pax)" },
  { id: "pm-61", name: "Chopsuey Noodles Bilao (Large)", description: "Tray good for 18–20 pax.", price: 1050, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Chopsuey Noodles Bilao", variantLabel: "Large (18–20 pax)" },
  { id: "pm-62", name: "Pancit Sisig Bilao (XS)", description: "Tray good for 3–5 pax.", price: 530, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Pancit Sisig Bilao", variantLabel: "XS (3–5 pax)" },
  { id: "pm-63", name: "Pancit Sisig Bilao (Small)", description: "Tray good for 8–10 pax.", price: 680, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Pancit Sisig Bilao", variantLabel: "Small (8–10 pax)" },
  { id: "pm-64", name: "Pancit Sisig Bilao (Med)", description: "Tray good for 12–15 pax.", price: 880, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Pancit Sisig Bilao", variantLabel: "Med (12–15 pax)" },
  { id: "pm-65", name: "Pancit Sisig Bilao (Large)", description: "Tray good for 18–20 pax.", price: 1050, category: "Pancit sa Bilao", categories: ["Pancit sa Bilao", "Pancit / Noodles"], variantGroup: "Pancit Sisig Bilao", variantLabel: "Large (18–20 pax)" },

  // ——— Chicken — Mga Manok ng Pasay ———
  { id: "pm-66", name: "Buttered Chicken (Half)", description: "Choice cuts only. Half good for 2–3 pax.", price: 200, category: "Chicken", categories: ["Chicken"], variantGroup: "Buttered Chicken", variantLabel: "Half" },
  { id: "pm-67", name: "Buttered Chicken (Whole)", description: "Choice cuts only. Whole good for 3–4 pax.", price: 400, category: "Chicken", categories: ["Chicken"], variantGroup: "Buttered Chicken", variantLabel: "Whole" },
  { id: "pm-68", name: "Capitol Chicken (Half)", description: "Choice cuts only. Half good for 2–3 pax.", price: 200, category: "Chicken", categories: ["Chicken"], variantGroup: "Capitol Chicken", variantLabel: "Half" },
  { id: "pm-69", name: "Capitol Chicken (Whole)", description: "Choice cuts only. Whole good for 3–4 pax.", price: 400, category: "Chicken", categories: ["Chicken"], variantGroup: "Capitol Chicken", variantLabel: "Whole" },
  { id: "pm-70", name: "Fried Chicken (Half)", description: "Half good for 2–3 pax.", price: 210, category: "Chicken", categories: ["Chicken"], variantGroup: "Fried Chicken", variantLabel: "Half" },
  { id: "pm-71", name: "Fried Chicken (Whole)", description: "Whole good for 3–4 pax.", price: 420, category: "Chicken", categories: ["Chicken"], variantGroup: "Fried Chicken", variantLabel: "Whole" },
  { id: "pm-72", name: "Garlic Fried Chicken", description: "Whole good for 3–4 pax.", price: 420, category: "Chicken", categories: ["Chicken"] },
  { id: "pm-73", name: "Sizzling Chicken", description: "Whole good for 3–4 pax.", price: 420, category: "Chicken", categories: ["Chicken"] },
  { id: "pm-74", name: "Lutong Bahay", description: "Home-style chicken dish. Whole good for 3–4 pax.", price: 420, category: "Chicken", categories: ["Chicken"] },

  // ——— Kabayo ———
  { id: "pm-75", name: "Adobong Kabayo", description: "Kabayo adobo. Good for 2–3 pax.", price: 260, category: "Kabayo", categories: ["Kabayo"] },
  { id: "pm-76", name: "Tapang Kabayo", description: "Cured and grilled kabayo. Good for 2–3 pax.", price: 270, category: "Kabayo", categories: ["Kabayo"] },
  { id: "pm-77", name: "Kalderetang Kabayo", description: "Kabayo caldereta. Good for 2–3 pax.", price: 270, category: "Kabayo", categories: ["Kabayo"] },

  // ——— Vegetables ———
  { id: "pm-78", name: "Chopsuey", description: "Mixed vegetables stir-fried in light sauce. Good for 2–3 pax.", price: 200, category: "Vegetables", categories: ["Vegetables"] },
  { id: "pm-79", name: "Gising-Gising", description: "Red chopsuey, not sigarilyas. Good for 2–3 pax.", price: 200, category: "Vegetables", categories: ["Vegetables"] },

  // ——— Rice ———
  { id: "pm-80", name: "Steamed Rice", description: "Freshly cooked white rice. Good for 4–6 pax.", price: 140, category: "Rice", categories: ["Rice"] },
  { id: "pm-81", name: "Yangchow Rice", description: "Yangchow fried rice. Good for 4–6 pax.", price: 240, category: "Rice", categories: ["Rice"] },

  // ——— Pork ———
  { id: "pm-82", name: "Lumpiang Shanghai", description: "Crispy pork spring rolls. Good for 2–3 pax.", price: 280, category: "Pork", categories: ["Pork"] },
  { id: "pm-83", name: "Sisig", description: "Sizzling chopped pork face and ears. Good for 2–3 pax.", price: 290, category: "Pork", categories: ["Pork"] },
  { id: "pm-84", name: "Lechon Kawali", description: "Crispy deep-fried pork belly. Good for 2–3 pax.", price: 290, category: "Pork", categories: ["Pork"] },
  { id: "pm-85", name: "Crispy Tenga", description: "Crispy-fried pig ears. Good for 2–3 pax.", price: 290, category: "Pork", categories: ["Pork"] },
  { id: "pm-86", name: "Sweet & Sour Pork", description: "Sweet and sour pork. Good for 2–3 pax.", price: 290, category: "Pork", categories: ["Pork"] },
  { id: "pm-87", name: "Grilled Pork", description: "Grilled pork. Good for 2–3 pax.", price: 290, category: "Pork", categories: ["Pork"] },
  { id: "pm-88", name: "Tokwa Baboy", description: "Tofu and pork in savory sauce. Good for 2–3 pax.", price: 290, category: "Pork", categories: ["Pork"] },

  // ——— Capitol Best-Sellers ———
  { id: "pm-89", name: "Crispy Pata", description: "Deep-fried pork leg. Good for 3–5 pax.", price: 680, category: "Capitol Best-Sellers", categories: ["Capitol Best-Sellers", "Pork"] },
  { id: "pm-90", name: "Patatim", description: "Braised pork leg in sweet sauce. Good for 3–5 pax.", price: 780, category: "Capitol Best-Sellers", categories: ["Capitol Best-Sellers", "Pork"] },
  { id: "pm-91", name: "Crispy Ulo", description: "Pasay's Famous crispy pig head. Good for 3–5 pax.", price: 750, category: "Capitol Best-Sellers", categories: ["Capitol Best-Sellers", "Pork"] },

  // ——— Seafood ———
  { id: "pm-92", name: "Sweet & Sour Fish Fillet", description: "Sweet and sour fish fillet. Good for 2–3 pax.", price: 290, category: "Seafood", categories: ["Seafood"] },
  { id: "pm-93", name: "Fish Tofu Tausi", description: "Fish tofu in tausi (black bean) sauce. Good for 2–3 pax.", price: 290, category: "Seafood", categories: ["Seafood"] },
  { id: "pm-94", name: "Kilawin Isda", description: "Citrus-cured fish kilawin. Good for 2–3 pax.", price: 290, category: "Seafood", categories: ["Seafood"] },
  { id: "pm-95", name: "Sizzling Squid", description: "Sizzling squid. Good for 2–3 pax.", price: 290, category: "Seafood", categories: ["Seafood"] },
  { id: "pm-96", name: "Calamares", description: "Crispy fried squid rings. Good for 2–3 pax.", price: 290, category: "Seafood", categories: ["Seafood"] },
  { id: "pm-97", name: "Camaron", description: "Battered fried shrimp. Good for 2–3 pax.", price: 290, category: "Seafood", categories: ["Seafood"] },
  { id: "pm-98", name: "Sizzling Gambas", description: "Sizzling garlic shrimp. Good for 2–3 pax.", price: 290, category: "Seafood", categories: ["Seafood"] },
  { id: "pm-99", name: "Tempura", description: "Crispy shrimp tempura. Good for 2–3 pax.", price: 320, category: "Seafood", categories: ["Seafood"] },
  { id: "pm-100", name: "Mixed Seafood", description: "Assorted seafood medley. Good for 2–3 pax.", price: 320, category: "Seafood", categories: ["Seafood"] },

  // ——— Soup ———
  { id: "pm-101", name: "Hototay Soup", description: "Chinese-style mixed vegetable soup. Good for 2–3 pax.", price: 240, category: "Soup", categories: ["Soup"] },
  { id: "pm-102", name: "Maki Soup", description: "Maki soup. Good for 2–3 pax.", price: 240, category: "Soup", categories: ["Soup"] },
  { id: "pm-103", name: "Nido Soup", description: "Shredded chicken and egg noodle soup. Good for 2–3 pax.", price: 240, category: "Soup", categories: ["Soup"] },
];

export const PACKED_MEAL_GUIDELINES = {
  intro: "Ideal for crew meals, events, office parties, and meetings.",
  minimumOrder: "Minimum order: 10 packs per delivery and 10 packs per kind.",
  advanceOrder: "Advance order required.",
  bulkOrder: "Orders of 100 or more packs should be placed at least 2 days before the intended date.",
  landline: "8556-1313",
  mobile: "09175141300",
} as const;
