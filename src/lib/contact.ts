/** Last contact number used by the signed-in user, persisted locally. */
function contactStorageKey(userId: string) {
  return `capitol-contact:${userId}`;
}

export function getStoredContact(userId: string | undefined) {
  if (!userId) return "";
  try {
    return localStorage.getItem(contactStorageKey(userId)) ?? "";
  } catch {
    return "";
  }
}

export function saveStoredContact(userId: string, contact: string) {
  try {
    localStorage.setItem(contactStorageKey(userId), contact);
  } catch {}
}
