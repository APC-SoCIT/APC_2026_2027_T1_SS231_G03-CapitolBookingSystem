/** Profile contact details for the signed-in user.
 *
 * Supabase `profiles` (phone/addresses) is the source of truth so details
 * follow the customer across devices. localStorage stays as an offline cache
 * so forms can prefill synchronously before the network round-trip.
 */
import { supabase } from "./supabase";

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

function toAddresses(value: unknown): StoredAddress[] {
  return Array.isArray(value) ? value.map(toAddress) : [];
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

/** Pull the server copy into the local cache. Returns merged profile. */
export async function fetchStoredProfile(
  userId: string,
): Promise<StoredProfile> {
  const cached = getStoredProfile(userId);
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("phone, addresses")
      .eq("id", userId)
      .maybeSingle<{ phone: string | null; addresses: unknown }>();
    if (error) throw error;
    if (!data) return cached;
    const merged: StoredProfile = {
      phone:
        typeof data.phone === "string" && data.phone
          ? data.phone
          : cached.phone,
      addresses:
        Array.isArray(data.addresses) && data.addresses.length > 0
          ? toAddresses(data.addresses)
          : cached.addresses,
    };
    try {
      localStorage.setItem(profileStorageKey(userId), JSON.stringify(merged));
      localStorage.setItem(contactStorageKey(userId), merged.phone);
    } catch {}
    return merged;
  } catch {
    return cached;
  }
}

function persistRemote(userId: string, profile: StoredProfile) {
  void supabase
    .from("profiles")
    .update({ phone: profile.phone, addresses: profile.addresses })
    .eq("id", userId)
    .then(({ error }) => {
      if (error) console.warn("Unable to sync profile details", error.message);
    });
}

export function saveStoredProfile(userId: string, profile: StoredProfile) {
  try {
    localStorage.setItem(profileStorageKey(userId), JSON.stringify(profile));
    localStorage.setItem(contactStorageKey(userId), profile.phone);
  } catch {}
  persistRemote(userId, profile);
}

export function getStoredContact(userId: string | undefined) {
  if (!userId) return "";
  return getStoredProfile(userId).phone;
}

export function saveStoredContact(userId: string, contact: string) {
  try {
    localStorage.setItem(contactStorageKey(userId), contact);
  } catch {}
  void supabase
    .from("profiles")
    .update({ phone: contact })
    .eq("id", userId)
    .then(({ error }) => {
      if (error) console.warn("Unable to sync contact number", error.message);
    });
}
