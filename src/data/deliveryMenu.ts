import { useEffect, useState } from "react";
import { PACKED_MENU_ITEMS, type MenuItem } from "../constants";

const STORAGE_KEY = "capitol-delivery-menu-items";
const CATEGORIES_STORAGE_KEY = "capitol-delivery-menu-categories";
const MENU_UPDATE_EVENT = "capitol-delivery-menu-updated";
const MENU_BROADCAST_CHANNEL = "capitol-delivery-menu-channel";

export type CategoryDefinition = {
  name: string;
  hidden: boolean;
};

export const DEFAULT_CATEGORY_DEFS: CategoryDefinition[] = [
  { name: "Solo Meals", hidden: false },
  { name: "Sides", hidden: false },
  { name: "Desserts", hidden: false },
  { name: "Chicken", hidden: true },
  { name: "Pork", hidden: true },
  { name: "Beef", hidden: true },
  { name: "Vegetables", hidden: true },
  { name: "Pasta & Noodles", hidden: true },
];

export const DEFAULT_CATEGORIES = DEFAULT_CATEGORY_DEFS.map((c) => c.name);
export const MENU_CATEGORIES = DEFAULT_CATEGORIES;
export type MenuCategory = string;

const HIDDEN_DEFAULT_NAMES = new Set([
  "chicken",
  "beef",
  "pork",
  "vegetables",
  "noodles",
  "pasta & noodles",
  "pasta&noodles",
]);

function notifyMenuUpdated(): void {
  // 1. Notify listeners in the same window/tab
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MENU_UPDATE_EVENT));
  }

  // 2. Broadcast to other tabs/windows of the same browser
  if (typeof BroadcastChannel !== "undefined") {
    try {
      const channel = new BroadcastChannel(MENU_BROADCAST_CHANNEL);
      channel.postMessage({ type: "MENU_UPDATED", timestamp: Date.now() });
      channel.close();
    } catch {
      // BroadcastChannel unavailable
    }
  }
}

/* ================================================================== */
/*  Categories CRUD & State                                           */
/* ================================================================== */

export function parseCategoryDefs(raw: unknown): CategoryDefinition[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [...DEFAULT_CATEGORY_DEFS];
  }

  const defs: CategoryDefinition[] = [];
  const seen = new Set<string>();

  for (const entry of raw) {
    if (typeof entry === "string" && entry.trim()) {
      const name = entry.trim();
      const lower = name.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        defs.push({
          name,
          hidden: HIDDEN_DEFAULT_NAMES.has(lower),
        });
      }
    } else if (
      entry &&
      typeof entry === "object" &&
      typeof (entry as { name?: unknown }).name === "string" &&
      (entry as { name: string }).name.trim()
    ) {
      const name = (entry as { name: string }).name.trim();
      const lower = name.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        defs.push({
          name,
          hidden: Boolean((entry as { hidden?: unknown }).hidden),
        });
      }
    }
  }

  // Ensure "Solo Meals" is present if migrating from an older array
  if (!seen.has("solo meals")) {
    defs.unshift({ name: "Solo Meals", hidden: false });
  }

  return defs.length > 0 ? defs : [...DEFAULT_CATEGORY_DEFS];
}

export function getCategoryDefs(): CategoryDefinition[] {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return [...DEFAULT_CATEGORY_DEFS];
  }
  const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
  if (!stored) return [...DEFAULT_CATEGORY_DEFS];
  try {
    const parsed = JSON.parse(stored);
    return parseCategoryDefs(parsed);
  } catch {
    return [...DEFAULT_CATEGORY_DEFS];
  }
}

export function saveCategoryDefs(defs: CategoryDefinition[]): void {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(defs));
  }
  notifyMenuUpdated();
}

export function getCategories(includeHidden = false): string[] {
  return getCategoryDefs()
    .filter((d) => includeHidden || !d.hidden)
    .map((d) => d.name);
}

export function saveCategories(categories: string[]): void {
  const currentDefs = getCategoryDefs();
  const defMap = new Map(currentDefs.map((d) => [d.name.toLowerCase(), d.hidden]));
  const updatedDefs: CategoryDefinition[] = categories.map((name) => ({
    name,
    hidden: defMap.has(name.toLowerCase())
      ? (defMap.get(name.toLowerCase()) as boolean)
      : HIDDEN_DEFAULT_NAMES.has(name.toLowerCase()),
  }));
  saveCategoryDefs(updatedDefs);
}

export function addCategory(categoryName: string, hidden = false): boolean {
  const trimmed = categoryName.trim();
  if (!trimmed) return false;
  const defs = getCategoryDefs();
  if (defs.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
    return false;
  }
  defs.push({ name: trimmed, hidden });
  saveCategoryDefs(defs);
  return true;
}

export function toggleCategoryHidden(categoryName: string): boolean {
  const defs = getCategoryDefs();
  const target = defs.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());
  if (!target) return false;
  target.hidden = !target.hidden;
  saveCategoryDefs(defs);
  return true;
}

export function updateCategory(oldName: string, newName: string, hidden?: boolean): boolean {
  const trimmed = newName.trim();
  if (!trimmed) return false;
  const defs = getCategoryDefs();
  const index = defs.findIndex((c) => c.name.toLowerCase() === oldName.toLowerCase());
  if (index === -1) return false;

  // Collision with another category
  if (defs.some((c, i) => i !== index && c.name.toLowerCase() === trimmed.toLowerCase())) {
    return false;
  }

  defs[index] = {
    name: trimmed,
    hidden: hidden !== undefined ? hidden : defs[index].hidden,
  };
  saveCategoryDefs(defs);

  // Update all items assigned to oldName
  const items = getMenuItems();
  let changed = false;
  const updatedItems = items.map((item) => {
    let itemChanged = false;
    let nextCategory = item.category;
    let nextCategories = item.categories && item.categories.length > 0
      ? [...item.categories]
      : item.category
        ? [item.category]
        : [];

    if (item.category.toLowerCase() === oldName.toLowerCase()) {
      nextCategory = trimmed;
      itemChanged = true;
    }
    if (nextCategories.some((c) => c.toLowerCase() === oldName.toLowerCase())) {
      nextCategories = nextCategories.map((c) =>
        c.toLowerCase() === oldName.toLowerCase() ? trimmed : c,
      );
      itemChanged = true;
    }

    if (itemChanged) {
      changed = true;
      return {
        ...item,
        category: nextCategory,
        categories: nextCategories,
      };
    }
    return item;
  });

  if (changed) {
    saveMenuItems(updatedItems);
  }

  return true;
}

export function deleteCategory(categoryName: string, reassignTo?: string): boolean {
  const defs = getCategoryDefs();
  if (defs.length <= 1) return false;

  const filtered = defs.filter((c) => c.name.toLowerCase() !== categoryName.toLowerCase());
  saveCategoryDefs(filtered);

  const fallback = reassignTo || filtered[0].name;
  const items = getMenuItems();
  let changed = false;

  const updatedItems = items.map((item) => {
    let itemChanged = false;
    let nextCategory = item.category;
    let nextCategories = item.categories && item.categories.length > 0
      ? [...item.categories]
      : item.category
        ? [item.category]
        : [];

    if (item.category.toLowerCase() === categoryName.toLowerCase()) {
      nextCategory = fallback;
      itemChanged = true;
    }
    if (nextCategories.some((c) => c.toLowerCase() === categoryName.toLowerCase())) {
      nextCategories = nextCategories
        .map((c) => (c.toLowerCase() === categoryName.toLowerCase() ? fallback : c))
        .filter((c, idx, arr) => arr.indexOf(c) === idx);
      itemChanged = true;
    }

    if (itemChanged) {
      changed = true;
      return {
        ...item,
        category: nextCategory,
        categories: nextCategories,
      };
    }
    return item;
  });

  if (changed) {
    saveMenuItems(updatedItems);
  }

  return true;
}

export function resetCategories(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(CATEGORIES_STORAGE_KEY);
  }
  notifyMenuUpdated();
}

/**
 * Hook to subscribe to category definitions with hidden state in real-time.
 */
export function useDeliveryCategoryDefs(): CategoryDefinition[] {
  const [defs, setDefs] = useState<CategoryDefinition[]>(getCategoryDefs);

  useEffect(() => {
    const handleUpdate = () => {
      setDefs(getCategoryDefs());
    };

    window.addEventListener(MENU_UPDATE_EVENT, handleUpdate);

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === CATEGORIES_STORAGE_KEY ||
        e.key === STORAGE_KEY ||
        e.key === null
      ) {
        handleUpdate();
      }
    };
    window.addEventListener("storage", handleStorage);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel(MENU_BROADCAST_CHANNEL);
        channel.onmessage = () => {
          handleUpdate();
        };
      } catch {
        // BroadcastChannel unavailable
      }
    }

    return () => {
      window.removeEventListener(MENU_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleStorage);
      if (channel) {
        channel.close();
      }
    };
  }, []);

  return defs;
}

/**
 * Hook to subscribe to category names in real-time.
 * By default returns visible categories only (for customer menus).
 * Pass includeHidden = true to get all category names (for managers).
 */
export function useDeliveryCategories(includeHidden = false): string[] {
  const defs = useDeliveryCategoryDefs();
  return defs
    .filter((d) => includeHidden || !d.hidden)
    .map((d) => d.name);
}

/**
 * Helper to determine the visible category name to display on an item card.
 * If at least one category assigned to the item is not hidden, that category is returned.
 * If all assigned categories are hidden (or no category is assigned),
 * placeholder text "Category" is returned.
 */
export function getVisibleCategoryName(
  item: MenuItem,
  categoryDefs: CategoryDefinition[] = getCategoryDefs(),
): string {
  const hiddenSet = new Set(
    categoryDefs.filter((c) => c.hidden).map((c) => c.name.toLowerCase()),
  );
  const assigned =
    item.categories && item.categories.length > 0
      ? item.categories
      : item.category
        ? [item.category]
        : [];

  const visible = assigned.filter((cat) => !hiddenSet.has(cat.toLowerCase()));
  if (visible.length > 0) {
    return visible[0];
  }
  return "Category";
}

/* ================================================================== */
/*  Menu Items CRUD & State                                           */
/* ================================================================== */

export function getMenuItems(): MenuItem[] {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return [...PACKED_MENU_ITEMS];
  }
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [...PACKED_MENU_ITEMS];
  try {
    const parsed = JSON.parse(stored) as MenuItem[];
    if (Array.isArray(parsed)) {
      return parsed.map((item) => {
        // Normalize categories array for older stored items
        if (!item.categories || item.categories.length === 0) {
          const defaultItem = PACKED_MENU_ITEMS.find((d) => d.id === item.id);
          if (defaultItem?.categories) {
            return {
              ...item,
              category: item.category || defaultItem.category,
              categories: [...defaultItem.categories],
            };
          }
          return {
            ...item,
            categories: item.category ? [item.category] : [],
          };
        }
        return item;
      });
    }
    return [...PACKED_MENU_ITEMS];
  } catch {
    return [...PACKED_MENU_ITEMS];
  }
}

export function saveMenuItems(items: MenuItem[]): void {
  // Normalize items before saving
  const normalized = items.map((item) => {
    const categories = item.categories && item.categories.length > 0
      ? item.categories
      : item.category
        ? [item.category]
        : [];
    return {
      ...item,
      category: categories[0] || item.category || "Category",
      categories,
    };
  });

  if (typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }
  notifyMenuUpdated();
}

export function addMenuItem(item: MenuItem): void {
  const items = getMenuItems();
  items.push(item);
  saveMenuItems(items);
}

export function updateMenuItem(id: string, patch: Partial<MenuItem>): void {
  const items = getMenuItems().map((item) =>
    item.id === id ? { ...item, ...patch } : item,
  );
  saveMenuItems(items);
}

export function deleteMenuItem(id: string): void {
  const items = getMenuItems().filter((item) => item.id !== id);
  saveMenuItems(items);
}

export function resetMenuItems(): void {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  notifyMenuUpdated();
}

/**
 * React hook to subscribe to delivery menu items in real-time.
 */
export function useDeliveryMenuItems(): MenuItem[] {
  const [items, setItems] = useState<MenuItem[]>(getMenuItems);

  useEffect(() => {
    const handleUpdate = () => {
      setItems(getMenuItems());
    };

    window.addEventListener(MENU_UPDATE_EVENT, handleUpdate);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) {
        handleUpdate();
      }
    };
    window.addEventListener("storage", handleStorage);

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel(MENU_BROADCAST_CHANNEL);
        channel.onmessage = () => {
          handleUpdate();
        };
      } catch {
        // BroadcastChannel unavailable
      }
    }

    return () => {
      window.removeEventListener(MENU_UPDATE_EVENT, handleUpdate);
      window.removeEventListener("storage", handleStorage);
      if (channel) {
        channel.close();
      }
    };
  }, []);

  return items;
}

let nextIdCounter = 100;

export function generateMenuItemId(): string {
  const existing = getMenuItems();
  const usedNumbers = existing
    .map((item) => {
      const match = item.id.match(/^pm-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(Boolean);
  const maxNum = usedNumbers.length > 0 ? Math.max(...usedNumbers) : 0;
  nextIdCounter = Math.max(nextIdCounter, maxNum + 1);
  const id = `pm-${String(nextIdCounter).padStart(2, "0")}`;
  nextIdCounter++;
  return id;
}
