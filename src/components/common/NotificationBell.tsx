import { Bell, CalendarDays, MessageCircle, ShoppingBag, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  StaffNotification,
  StaffNotificationKind,
} from "../../data/staffNotifications";
import type { useStaffNotifications } from "../../hooks/useStaffNotifications";

const TOAST_DURATION_MS = 6000;

const KIND_ICONS: Record<StaffNotificationKind, typeof Bell> = {
  delivery: ShoppingBag,
  reservation: CalendarDays,
  inquiry: MessageCircle,
};

function timeAgo(iso: string) {
  const seconds = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

type NotificationBellProps = {
  notifications: ReturnType<typeof useStaffNotifications>;
};

export function NotificationBell({ notifications }: NotificationBellProps) {
  const { items, isUnread, unreadCount, markRead, latest, dismissLatest } = notifications;
  const [open, setOpen] = useState(false);
  const [ringing, setRinging] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (!latest) return;
    setRinging(true);
    const stopRing = window.setTimeout(() => setRinging(false), 1000);
    const hideToast = window.setTimeout(dismissLatest, TOAST_DURATION_MS);
    return () => {
      window.clearTimeout(stopRing);
      window.clearTimeout(hideToast);
    };
  }, [latest, dismissLatest]);

  const openItem = (item: StaffNotification) => {
    markRead(item.path);
    setOpen(false);
    dismissLatest();
    navigate(item.path);
  };

  const LatestIcon = latest ? KIND_ICONS[latest.kind] : null;

  return (
    <div className="notif" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
        className={`notif__bell ${ringing ? "notif__bell--ringing" : ""}`}
        onClick={() => setOpen((value) => !value)}
        title="Notifications"
        type="button"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="notif__count">{unreadCount > 9 ? "9+" : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif__panel" role="dialog" aria-label="Notifications">
          <div className="notif__panel-head">
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button className="notif__mark-all" onClick={() => markRead()} type="button">
                Mark all read
              </button>
            )}
          </div>
          {items.length ? (
            <ul className="notif__list">
              {items.map((item) => {
                const Icon = KIND_ICONS[item.kind];
                const unread = isUnread(item);
                return (
                  <li key={item.id}>
                    <button
                      className={`notif__item ${unread ? "notif__item--unread" : ""}`}
                      onClick={() => openItem(item)}
                      type="button"
                    >
                      <span className={`notif__icon notif__icon--${item.kind}`}>
                        <Icon size={15} />
                      </span>
                      <span className="notif__text">
                        <strong>{item.title}</strong>
                        <span>{item.detail}</span>
                        <small>{timeAgo(item.createdAt)}</small>
                      </span>
                      {unread && <span className="notif__dot" aria-label="Unread" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="notif__empty">No activity yet.</p>
          )}
        </div>
      )}

      {latest && !open && (
        <div className="notif-toast" role="status">
          <button className="notif-toast__body" onClick={() => openItem(latest)} type="button">
            <span className={`notif__icon notif__icon--${latest.kind}`}>
              {LatestIcon && <LatestIcon size={15} />}
            </span>
            <span className="notif__text">
              <strong>{latest.title}</strong>
              <span>{latest.detail}</span>
            </span>
          </button>
          <button
            aria-label="Dismiss notification"
            className="notif-toast__close"
            onClick={dismissLatest}
            type="button"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
