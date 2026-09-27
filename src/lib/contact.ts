/** Profile contact details for the signed-in user, persisted locally. */
export interface StoredAddress {
  label: string;
  address: string;
  note: string;
}

export interface StoredProfile {
  phone: string;
  addresses: StoredAddress[];
}

function profileStorageKey(userId: string) {
  return `capitol-profile:${userId}`;
}

function contactStorageKey(userId: string) {
  return `capitol-contact:${userId}`;
}

function toAddress(value: unknown): StoredAddress {
  const entry = (value ?? {}) as Partial<StoredAddress>;
  return {
    label: typeof entry.label === "string" ? entry.label : "",
    address: typeof entry.address === "string" ? entry.address : "",
    note: typeof entry.note === "string" ? entry.note : "",
  };
}

export function getStoredProfile(userId: string | undefined): StoredProfile {
  const empty: StoredProfile = { phone: "", addresses: [] };
  if (!userId) return empty;
  try {
    const parsed = JSON.parse(
      localStorage.getItem(profileStorageKey(userId)) ?? "{}",
    ) as {
      phone?: unknown;
      addresses?: unknown;
      address?: unknown;
    };
    // Migrate the previous single-address shape.
    const addresses = Array.isArray(parsed.addresses)
      ? parsed.addresses.map(toAddress)
      : typeof parsed.address === "string" && parsed.address
        ? [{ label: "", address: parsed.address, note: "" }]
        : [];
    return {
      phone:
        typeof parsed.phone === "string"
          ? parsed.phone
          : (localStorage.getItem(contactStorageKey(userId)) ?? ""),
      addresses,
    };
  } catch {
    return empty;
  }
}

export function saveStoredProfile(userId: string, profile: StoredProfile) {
  try {
    localStorage.setItem(profileStorageKey(userId), JSON.stringify(profile));
    localStorage.setItem(contactStorageKey(userId), profile.phone);
  } catch {}
}

export function getStoredContact(userId: string | undefined) {
  if (!userId) return "";
  return getStoredProfile(userId).phone;
}

export function saveStoredContact(userId: string, contact: string) {
  try {
    localStorage.setItem(contactStorageKey(userId), contact);
  } catch {}
}
