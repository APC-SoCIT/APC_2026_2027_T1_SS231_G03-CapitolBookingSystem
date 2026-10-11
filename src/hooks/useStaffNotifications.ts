import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  fetchStaffNotifications,
  NOTIFICATION_PATHS,
  subscribeStaffNotifications,
  type StaffNotification,
  type StaffNotificationKind,
} from "../data/staffNotifications";
import { supabase } from "../lib/supabase";
import { canAccessRoute } from "../lib/roles";

const POLL_INTERVAL_MS = 15_000;
const STAFF_ROLES = ["front_of_house", "restaurant_manager", "system_admin"];

// Per-screen "seen up to" timestamps, so each tab clears on its own.
type SeenMap = Record<string, string>;

const seenKey = (userId: string) => `capitol:notifications-seen:${userId}`;

function readSeen(userId: string): SeenMap {
  try {
    return JSON.parse(localStorage.getItem(seenKey(userId)) ?? "{}") as SeenMap;
  } catch {
    return {};
  }
}

function writeSeen(userId: string, seen: SeenMap) {
  try {
    localStorage.setItem(seenKey(userId), JSON.stringify(seen));
  } catch {
    // Storage unavailable (private mode): read state just won't persist.
  }
}

const newestIn = (items: StaffNotification[], path: string) =>
  items.find((item) => item.path === path)?.createdAt;

export function useStaffNotifications() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const userId = user?.id ?? null;
  const role = user?.role ?? null;
  const enabled = !!role && STAFF_ROLES.includes(role);

  const kinds = useMemo<StaffNotificationKind[]>(
    () =>
      enabled
        ? (Object.keys(NOTIFICATION_PATHS) as StaffNotificationKind[]).filter((kind) =>
            canAccessRoute({ role }, NOTIFICATION_PATHS[kind]),
          )
        : [],
    [enabled, role],
  );

  const [items, setItems] = useState<StaffNotification[]>([]);
  const [seen, setSeen] = useState<SeenMap>({});
  const [latest, setLatest] = useState<StaffNotification | null>(null);
  const knownIds = useRef<Set<string> | null>(null);
  const newestSeenAt = useRef(0);

  const refresh = useCallback(async () => {
    if (!kinds.length) return;
    try {
      const next = await fetchStaffNotifications(kinds);
      const known = knownIds.current;
      if (known) {
        // Only genuinely newer rows pop up, not older ones that slid back
        // into the list after something was deleted.
        const fresh = next.find(
          (item) => !known.has(item.id) && Date.parse(item.createdAt) > newestSeenAt.current,
        );
        if (fresh) setLatest(fresh);
      }
      knownIds.current = new Set(next.map((item) => item.id));
      if (next[0]) newestSeenAt.current = Math.max(newestSeenAt.current, Date.parse(next[0].createdAt));
      setItems(next);
    } catch {
      // Network hiccup: keep the last list and retry on the next poll.
    }
  }, [kinds]);

  useEffect(() => {
    setItems([]);
    setLatest(null);
    knownIds.current = null;
    newestSeenAt.current = 0;
    if (!userId || !kinds.length) return;

    setSeen(readSeen(userId));
    void refresh();
    const channel = subscribeStaffNotifications(() => void refresh());
    const timer = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [userId, kinds, refresh]);

  const markRead = useCallback(
    (path?: string) => {
      if (!userId) return;
      setSeen((current) => {
        const paths = path ? [path] : Object.values(NOTIFICATION_PATHS);
        const next = { ...current };
        let changed = false;
        for (const p of paths) {
          const newest = newestIn(items, p);
          if (newest && (!next[p] || Date.parse(newest) > Date.parse(next[p]))) {
            next[p] = newest;
            changed = true;
          }
        }
        if (!changed) return current;
        writeSeen(userId, next);
        return next;
      });
    },
    [items, userId],
  );

  // First visit ever: start from "everything so far is read" instead of
  // flooding a new staff account with old orders.
  useEffect(() => {
    if (!userId || !items.length) return;
    setSeen((current) => {
      const next = { ...current };
      let changed = false;
      for (const path of Object.values(NOTIFICATION_PATHS)) {
        const newest = newestIn(items, path);
        if (!next[path] && newest) {
          next[path] = newest;
          changed = true;
        }
      }
      if (!changed) return current;
      writeSeen(userId, next);
      return next;
    });
  }, [items, userId]);

  // Being on a screen means its new items are already in front of you.
  useEffect(() => {
    if (Object.values(NOTIFICATION_PATHS).includes(pathname)) markRead(pathname);
  }, [pathname, items, markRead]);

  const isUnread = useCallback(
    (item: StaffNotification) =>
      !seen[item.path] || Date.parse(item.createdAt) > Date.parse(seen[item.path]),
    [seen],
  );

  const unreadByPath = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      if (isUnread(item)) counts[item.path] = (counts[item.path] ?? 0) + 1;
    }
    return counts;
  }, [items, isUnread]);

  const dismissLatest = useCallback(() => setLatest(null), []);

  const unreadCount = Object.values(unreadByPath).reduce((sum, n) => sum + n, 0);

  return {
    enabled: enabled && kinds.length > 0,
    items,
    isUnread,
    unreadByPath,
    unreadCount,
    markRead,
    latest,
    dismissLatest,
  };
}
