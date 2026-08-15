export type NavigationItem = { label: string; path: string };

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: "Catering", path: "/catering" },
  { label: "Function Rooms", path: "/function-rooms" },
  { label: "Delivery", path: "/delivery" },
  { label: "Analytics", path: "/analytics" },
];

export const RESTAURANT_INFO = {
  name: "Capitol",
  tagline: "Pasay City's Oldest Restaurant",
  since: "1940",
  phone: "+63 (2) 8XXX-XXXX",
  email: "reservations@capitolrestaurant.com",
  address: "Pasay City, Metro Manila, Philippines",
};

export type CateringPackage = {
  id: string;
  name: string;
  pricePerPax: number;
  minPax: number;
  description: string;
  inclusions: string[];
};
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
    name: "Package 1",
    pricePerPax: 350,
    minPax: 50,
    description:
      "Our starter package for intimate gatherings and small celebrations.",
    inclusions: [
      "Steamed Rice",
      "Soup of the Day",
      "2 Main Dish Selections",
      "1 Vegetable Dish",
      "Dessert of the Day",
      "Round-trip Delivery within Pasay",
    ],
  },
  {
    id: "pkg-2",
    name: "Package 2",
    pricePerPax: 500,
    minPax: 50,
    description:
      "A wider selection ideal for corporate events and family gatherings.",
    inclusions: [
      "Steamed Rice",
      "Soup of the Day",
      "3 Main Dish Selections",
      "1 Vegetable Dish",
      "Pancit (choice of 1)",
      "Dessert of the Day",
      "Fresh Fruit Platter",
      "Round-trip Delivery within Metro Manila",
    ],
  },
  {
    id: "pkg-3",
    name: "Package 3",
    pricePerPax: 750,
    minPax: 50,
    description:
      "Full-service catering for grand celebrations and special occasions.",
    inclusions: [
      "Steamed Rice",
      "Soup of the Day",
      "4 Main Dish Selections",
      "2 Vegetable Dishes",
      "Pancit (choice of 2)",
      "Lechon (per head allocation)",
      "Dessert Spread (3 selections)",
      "Fresh Fruit Platter",
      "Waitstaff Service (up to 4 hours)",
      "Round-trip Delivery (Anywhere in Metro Manila)",
    ],
  },
];

export const PACKED_MENU_ITEMS: MenuItem[] = [
  {
    id: "pm-01",
    name: "Adobong Manok",
    description: "Classic Filipino chicken adobo in garlic, soy, and vinegar.",
    price: 120,
    category: "Chicken",
  },
  {
    id: "pm-02",
    name: "Lechon Kawali",
    description: "Crispy deep-fried pork belly served with liver sauce.",
    price: 145,
    category: "Pork",
  },
  {
    id: "pm-03",
    name: "Pork Sinigang",
    description: "Tamarind-based pork soup with fresh vegetables.",
    price: 135,
    category: "Pork",
  },
  {
    id: "pm-04",
    name: "Beef Kaldereta",
    description: "Braised beef in tomato and liver sauce with bell peppers.",
    price: 165,
    category: "Beef",
  },
  {
    id: "pm-05",
    name: "Chicken Tinola",
    description:
      "Ginger-based chicken soup with green papaya and chili leaves.",
    price: 115,
    category: "Chicken",
  },
  {
    id: "pm-06",
    name: "Pinakbet",
    description: "Mixed vegetables sautéed with shrimp paste and pork.",
    price: 100,
    category: "Vegetables",
  },
  {
    id: "pm-07",
    name: "Laing",
    description: "Taro leaves simmered in coconut milk with chili.",
    price: 95,
    category: "Vegetables",
  },
  {
    id: "pm-08",
    name: "Pancit Bihon",
    description:
      "Stir-fried rice noodles with pork, vegetables, and soy sauce.",
    price: 110,
    category: "Noodles",
  },
  {
    id: "pm-09",
    name: "Steamed Rice",
    description: "Freshly cooked premium white rice per serving.",
    price: 35,
    category: "Sides",
  },
  {
    id: "pm-10",
    name: "Leche Flan",
    description: "Classic Filipino caramel custard dessert.",
    price: 75,
    category: "Desserts",
  },
];
