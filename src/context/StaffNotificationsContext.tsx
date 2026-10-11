import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
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
const FLASH_DURATION_MS = 2200;
const MAX_ACKED_IDS = 300;
const STAFF_ROLES = ["front_of_house", "restaurant_manager", "system_admin"];

// Per-screen "seen up to" timestamps, so each tab's badge clears on its own.
type SeenMap = Record<string, string>;

// Persisted per staff account in this browser.
type StoredState = {
  seen: SeenMap;
  // Rows created after this are "new" until someone interacts with them.
  since: string | null;
  acked: string[];
};

const storageKey = (userId: string) => `capitol:notifications:${userId}`;

function readStored(userId: string): StoredState {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(userId)) ?? "{}") as Partial<StoredState>;
    return { seen: parsed.seen ?? {}, since: parsed.since ?? null, acked: parsed.acked ?? [] };
  } catch {
    return { seen: {}, since: null, acked: [] };
  }
}

function writeStored(userId: string, state: StoredState) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode): read state just won't persist.
  }
}

const EMPTY_STORED: StoredState = { seen: {}, since: null, acked: [] };

const newestIn = (items: StaffNotification[], path: string) =>
  items.find((item) => item.path === path)?.createdAt;

function useStaffNotificationsState() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
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
  const [stored, setStored] = useState<StoredState>(EMPTY_STORED);
  const [latest, setLatest] = useState<StaffNotification | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const knownIds = useRef<Set<string> | null>(null);
  const newestSeenAt = useRef(0);

  const updateStored = useCallback(
    (update: (current: StoredState) => StoredState) => {
      if (!userId) return;
      setStored((current) => {
        const next = update(current);
        if (next !== current) writeStored(userId, next);
        return next;
      });
    },
    [userId],
  );

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

    setStored(readStored(userId));
    void refresh();
    const channel = subscribeStaffNotifications(() => void refresh());
    const timer = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [userId, kinds, refresh]);

  // First visit ever: start from "everything so far is read" instead of
  // flooding a new staff account with old orders.
  useEffect(() => {
    if (!items.length) return;
    updateStored((current) => {
      const seen = { ...current.seen };
      let changed = false;
      for (const path of Object.values(NOTIFICATION_PATHS)) {
        const newest = newestIn(items, path);
        if (!seen[path] && newest) {
          seen[path] = newest;
          changed = true;
        }
      }
      const since = current.since ?? items[0].createdAt;
      if (!changed && since === current.since) return current;
      return { ...current, seen, since };
    });
  }, [items, updateStored]);

  const markRead = useCallback(
    (path?: string) => {
      updateStored((current) => {
        const paths = path ? [path] : Object.values(NOTIFICATION_PATHS);
        const seen = { ...current.seen };
        let changed = false;
        for (const p of paths) {
          const newest = newestIn(items, p);
          if (newest && (!seen[p] || Date.parse(newest) > Date.parse(seen[p]))) {
            seen[p] = newest;
            changed = true;
          }
        }
        return changed ? { ...current, seen } : current;
      });
    },
    [items, updateStored],
  );

  // Being on a screen means its new items are already in front of you.
  useEffect(() => {
    if (Object.values(NOTIFICATION_PATHS).includes(pathname)) markRead(pathname);
  }, [pathname, items, markRead]);

  const isUnread = useCallback(
    (item: StaffNotification) =>
      !stored.seen[item.path] || Date.parse(item.createdAt) > Date.parse(stored.seen[item.path]),
    [stored.seen],
  );

  const newIds = useMemo(() => {
    const ids = new Set<string>();
    if (!stored.since) return ids;
    const since = Date.parse(stored.since);
    const acked = new Set(stored.acked);
    for (const item of items) {
      if (Date.parse(item.createdAt) > since && !acked.has(item.id)) ids.add(item.id);
    }
    return ids;
  }, [items, stored.since, stored.acked]);

  const isNew = useCallback((id: string) => newIds.has(id), [newIds]);

  const acknowledge = useCallback(
    (id: string) => {
      updateStored((current) =>
        current.acked.includes(id)
          ? current
          : { ...current, acked: [...current.acked, id].slice(-MAX_ACKED_IDS) },
      );
    },
    [updateStored],
  );

  const flashTimer = useRef<number>();
  const flash = useCallback((id: string) => {
    window.clearTimeout(flashTimer.current);
    setFlashId(id);
    flashTimer.current = window.setTimeout(() => setFlashId(null), FLASH_DURATION_MS);
  }, []);
  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  // Go to the item's screen; that screen scrolls to and flashes the row.
  const openNotification = useCallback(
    (item: StaffNotification) => {
      markRead(item.path);
      acknowledge(item.id);
      setLatest(null);
      navigate(item.path, { state: { notifFocus: item.id } });
    },
    [acknowledge, markRead, navigate],
  );

  const dismissLatest = useCallback(() => setLatest(null), []);

  const unreadByPath = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      if (isUnread(item)) counts[item.path] = (counts[item.path] ?? 0) + 1;
    }
    return counts;
  }, [items, isUnread]);

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
    openNotification,
    isNew,
    acknowledge,
    flashId,
    flash,
  };
}

export type StaffNotificationsValue = ReturnType<typeof useStaffNotificationsState>;

const StaffNotificationsContext = createContext<StaffNotificationsValue | null>(null);

export function StaffNotificationsProvider({ children }: { children: ReactNode }) {
  const value = useStaffNotificationsState();
  return (
    <StaffNotificationsContext.Provider value={value}>{children}</StaffNotificationsContext.Provider>
  );
}

export function useStaffNotifications() {
  const value = useContext(StaffNotificationsContext);
  if (!value) throw new Error("useStaffNotifications must be used inside StaffNotificationsProvider");
  return value;
}

/** Highlight state for one staff-screen row: faint while new, strong flash
 * when opened from a notification. Any click on the row acknowledges it. */
export function useNotificationRow(id: string) {
  const { isNew, acknowledge, flashId } = useStaffNotifications();
  const fresh = isNew(id);
  const className = flashId === id ? " notif-row--flash" : fresh ? " notif-row--new" : "";
  return {
    className,
    rowProps: {
      "data-notif-id": id,
      onClickCapture: fresh ? () => acknowledge(id) : undefined,
    },
  };
}

/** On a staff screen: when arriving from a notification, clear filters via
 * `reveal`, then scroll to the row and flash it once it has rendered. */
export function useNotificationFocus(reveal: (id: string) => void) {
  const location = useLocation();
  const navigate = useNavigate();
  const { flash } = useStaffNotifications();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const revealRef = useRef(reveal);
  revealRef.current = reveal;

  useEffect(() => {
    const focusId = (location.state as { notifFocus?: string } | null)?.notifFocus;
    if (!focusId) return;
    revealRef.current(focusId);
    setPendingId(focusId);
    // Drop the state so a refresh or back-navigation doesn't replay it.
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location, navigate]);

  useEffect(() => {
    if (!pendingId) return;
    const startedAt = Date.now();
    let timer = 0;
    // Rows load asynchronously, so wait for this one to render.
    const tryFocus = () => {
      const row = document.querySelector(`[data-notif-id="${CSS.escape(pendingId)}"]`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
        flash(pendingId);
        setPendingId(null);
      } else if (Date.now() - startedAt < 8000) {
        timer = window.setTimeout(tryFocus, 150);
      } else {
        setPendingId(null);
      }
    };
    timer = window.setTimeout(tryFocus, 50);
    return () => window.clearTimeout(timer);
  }, [pendingId, flash]);
}
