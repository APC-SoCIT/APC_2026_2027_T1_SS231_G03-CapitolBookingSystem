export type NavigationItem = { label: string; path: string };

export const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: 'Catering', path: '/catering' },
  { label: 'Function Rooms', path: '/function-rooms' },
  { label: 'Delivery', path: '/delivery' },
];

export const RESTAURANT_INFO = {
  name: 'Capitol',
  tagline: "Pasay City's Oldest Restaurant",
  since: '1940',
  phone: '+63 (2) 8XXX-XXXX',
  email: 'reservations@capitolrestaurant.com',
  address: 'Pasay City, Metro Manila, Philippines',
};
