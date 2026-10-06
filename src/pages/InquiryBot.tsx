import { Bot, Check, Clock, MessageSquare, RefreshCw, Search, Send, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StatusPill } from "../components/operations/StatusPill";
import { supabase } from "../lib/supabase";

type InquiryStatus = "New" | "In progress" | "Resolved";
type StatusFilter = "Needs reply" | "Requests" | "Resolved" | "All";

type MessengerInquiry = {
  id: string;
  name: string;
  type: string;
  message: string;
  status: InquiryStatus;
  receivedAt: string;
  staffReply: string;
  repliedAt: string;
};

type InquiryRow = {
  id: string;
  name: string;
  type: string;
  message: string;
  status: string;
  submitted_at: string | null;
  created_at: string;
  staff_reply?: string | null;
  replied_at?: string | null;
};

const STATUS_FILTERS: StatusFilter[] = ["Needs reply", "Requests", "Resolved", "All"];
// Saved by webhook.js when a Capitol question is outside what the agent knows and needs staff.
const UNANSWERED_TYPE = "Unanswered Question";
const isOpen = (inquiry: MessengerInquiry) => inquiry.status !== "Resolved";
const needsReply = (inquiry: MessengerInquiry) => isOpen(inquiry) && inquiry.type === UNANSWERED_TYPE;
const isOpenRequest = (inquiry: MessengerInquiry) => isOpen(inquiry) && inquiry.type !== UNANSWERED_TYPE;
// Inquiries created by the Messenger agent use this placeholder e-mail format.
const MESSENGER_EMAIL_PATTERN = "messenger%@placeholder.com";

function toInquiry(row: InquiryRow): MessengerInquiry {
  return {
    id: String(row.id),
    name: row.name,
    type: row.type,
    message: row.message,
    status: row.status as InquiryStatus,
    receivedAt: new Date(row.submitted_at || row.created_at).toLocaleString(),
    staffReply: row.staff_reply ?? "",
    repliedAt: row.replied_at ? new Date(row.replied_at).toLocaleString() : "",
  };
}

async function callInquiryAction(path: string, method: "POST" | "PATCH", body: object) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Your session has expired. Please sign in again.");

  const apiBase = (import.meta.env.VITE_WEBHOOK_URL || window.location.origin).replace(/\/+$/, "");
  const response = await fetch(`${apiBase}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The request failed. Please try again.");
  return toInquiry(result.inquiry as InquiryRow);
}

export function InquiryBot() {
  const [inquiries, setInquiries] = useState<MessengerInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Needs reply");
  const [typeFilter, setTypeFilter] = useState("All types");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);

  const loadInquiries = useCallback(async () => {
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .like("email", MESSENGER_EMAIL_PATTERN)
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError(`Could not load Messenger inquiries: ${error.message}`);
    } else {
      setLoadError(null);
      setInquiries(((data ?? []) as InquiryRow[]).map(toInquiry));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadInquiries();
    const timer = window.setInterval(() => void loadInquiries(), 10_000);
    return () => window.clearInterval(timer);
  }, [loadInquiries]);

  const runAction = async (id: string, action: () => Promise<MessengerInquiry>, successText: string) => {
    setBusyId(id);
    setNotice(null);
    try {
      const updated = await action();
      setInquiries((current) => current.map((inquiry) => (inquiry.id === updated.id ? updated : inquiry)));
      setNotice({ kind: "success", text: successText });
      return true;
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Something went wrong." });
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const setStatus = (inquiry: MessengerInquiry, status: InquiryStatus) =>
    void runAction(
      inquiry.id,
      () => callInquiryAction(`/inquiries/${encodeURIComponent(inquiry.id)}/status`, "PATCH", { status }),
      `Marked as ${status.toLowerCase()}.`,
    );

  const types = useMemo(() => ["All types", ...new Set(inquiries.map((inquiry) => inquiry.type))], [inquiries]);
  const needsReplyCount = inquiries.filter(needsReply).length;
  const requestCount = inquiries.filter(isOpenRequest).length;
  const tabCount: Record<StatusFilter, number> = {
    "Needs reply": needsReplyCount,
    Requests: requestCount,
    Resolved: inquiries.filter((inquiry) => !isOpen(inquiry)).length,
    All: inquiries.length,
  };

  const visibleInquiries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return inquiries.filter((inquiry) => {
      if (statusFilter === "Needs reply" && !needsReply(inquiry)) return false;
      if (statusFilter === "Requests" && !isOpenRequest(inquiry)) return false;
      if (statusFilter === "Resolved" && isOpen(inquiry)) return false;
      if (typeFilter !== "All types" && inquiry.type !== typeFilter) return false;
      if (!query) return true;
      return [inquiry.name, inquiry.type, inquiry.message, inquiry.staffReply].join(" ").toLowerCase().includes(query);
    });
  }, [inquiries, statusFilter, typeFilter, search]);

  const replyingTo = inquiries.find((inquiry) => inquiry.id === replyingId) ?? null;

  return (
    <div>
      <section className="section dashboard-section">
        <div className="dashboard-toolbar">
          <div>
            <p className="eyebrow">Capitol Restaurant · Messenger</p>
            <h2>Inquiry Bot</h2>
            <small className="ops-toolbar-hint">
              Needs reply: Capitol questions the AI agent could not answer from its information. Requests: catering, function room, and delivery requests to review. Replies are sent to the customer on Messenger.
            </small>
          </div>
          <button className="reset-button" onClick={() => void loadInquiries()} type="button">
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>

        {notice && (
          <div className={`bot-banner bot-banner--${notice.kind}`} role={notice.kind === "error" ? "alert" : "status"}>
            {notice.text}
          </div>
        )}
        {loadError && <div className="bot-banner bot-banner--error" role="alert">{loadError}</div>}

        <div className="dashboard-panel">
          <div className="dashboard-panel__header">
            <div>
              <p className="eyebrow">From Messenger</p>
              <h2>
                <Bot size={20} style={{ verticalAlign: "-3px", marginRight: "0.35rem" }} />
                {needsReplyCount > 0
                  ? `${needsReplyCount} ${needsReplyCount === 1 ? "question needs" : "questions need"} a staff reply`
                  : "No questions waiting"}
              </h2>
            </div>
            <label className="dashboard-search">
              <Search size={16} />
              <input
                aria-label="Search Messenger inquiries"
                placeholder="Search message, type, reply..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="ops-filter-row">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`ops-filter-chip ${statusFilter === filter ? "ops-filter-chip--active" : ""}`}
                onClick={() => setStatusFilter(filter)}
              >
                {filter} <span>{tabCount[filter]}</span>
              </button>
            ))}
            <span className="ops-filter-sep" />
            <select
              className="ops-status-select bot-type-select"
              aria-label="Filter by inquiry type"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
            >
              {types.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>

          <div className="bot-list">
            {loading ? (
              <p className="dashboard-empty">Loading Messenger inquiries...</p>
            ) : visibleInquiries.length === 0 ? (
              <p className="dashboard-empty">
                {inquiries.length === 0 ? "No Messenger inquiries yet." : "No inquiries match these filters."}
              </p>
            ) : (
              visibleInquiries.map((inquiry) => (
                <InquiryCard
                  key={inquiry.id}
                  inquiry={inquiry}
                  busy={busyId === inquiry.id}
                  onReply={() => setReplyingId(inquiry.id)}
                  onStatus={(status) => setStatus(inquiry, status)}
                />
              ))
            )}
          </div>
        </div>
      </section>

      {replyingTo && (
        <ReplyModal
          inquiry={replyingTo}
          busy={busyId === replyingTo.id}
          onClose={() => setReplyingId(null)}
          onSend={async (reply) => {
            const sent = await runAction(
              replyingTo.id,
              () => callInquiryAction(`/inquiries/${encodeURIComponent(replyingTo.id)}/reply`, "POST", { reply }),
              "Reply sent to the customer on Messenger.",
            );
            if (sent) setReplyingId(null);
          }}
        />
      )}
    </div>
  );
}

function InquiryCard({
  inquiry,
  busy,
  onReply,
  onStatus,
}: {
  inquiry: MessengerInquiry;
  busy: boolean;
  onReply: () => void;
  onStatus: (status: InquiryStatus) => void;
}) {
  const resolved = inquiry.status === "Resolved";
  return (
    <article className={`bot-card${resolved ? "" : " bot-card--open"}`}>
      <div className="bot-card__head">
        <div className="bot-card__who">
          <strong>{inquiry.name}</strong>
          <span className="bot-type-pill">{inquiry.type}</span>
        </div>
        <div className="bot-card__meta">
          <small>{inquiry.receivedAt}</small>
          <StatusPill status={inquiry.status} />
        </div>
      </div>

      <p className="bot-card__message">{inquiry.message}</p>

      {inquiry.staffReply && (
        <div className="bot-card__reply">
          <small>Staff reply{inquiry.repliedAt ? ` · ${inquiry.repliedAt}` : ""}</small>
          <p>{inquiry.staffReply}</p>
        </div>
      )}

      <div className="bot-card__actions">
        <button className="bot-action bot-action--primary" disabled={busy} onClick={onReply} type="button">
          <Send size={13} /> {inquiry.staffReply ? "Reply again" : "Reply on Messenger"}
        </button>
        {inquiry.status === "New" && (
          <button className="bot-action" disabled={busy} onClick={() => onStatus("In progress")} type="button">
            <Clock size={13} /> Mark in progress
          </button>
        )}
        {!resolved ? (
          <button className="bot-action" disabled={busy} onClick={() => onStatus("Resolved")} type="button">
            <Check size={13} /> Mark resolved
          </button>
        ) : (
          <button className="bot-action" disabled={busy} onClick={() => onStatus("In progress")} type="button">
            Reopen
          </button>
        )}
      </div>
    </article>
  );
}

function ReplyModal({
  inquiry,
  busy,
  onClose,
  onSend,
}: {
  inquiry: MessengerInquiry;
  busy: boolean;
  onClose: () => void;
  onSend: (reply: string) => void;
}) {
  const [reply, setReply] = useState("");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="ops-modal-backdrop" onClick={onClose} role="presentation">
      <div className="ops-modal bot-modal--narrow" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Reply to ${inquiry.name}`}>
        <header className="ops-modal__header">
          <div className="ops-modal__header-left">
            <span className="ops-modal__kicker">Reply on Messenger</span>
            <div className="ops-modal__title-row"><h2>{inquiry.name}</h2></div>
            <small className="ops-modal__subtitle">{inquiry.type} · {inquiry.receivedAt}</small>
          </div>
          <button type="button" className="ops-modal__close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="ops-modal__body">
          <div className="bot-card__quote">
            <small><MessageSquare size={12} /> Customer wrote</small>
            <p>{inquiry.message}</p>
          </div>
          <label className="ops-field ops-field--full">
            <span>Your reply *</span>
            <textarea
              className="ops-input ops-input--area"
              rows={5}
              autoFocus
              value={reply}
              onChange={(event) => setReply(event.target.value)}
            />
          </label>
          <p className="ops-hint">
            Facebook only allows replies within 24 hours of the customer&apos;s last message. Sending marks this inquiry as resolved.
          </p>
        </div>
        <footer className="ops-modal__footer">
          <button type="button" className="ops-btn ops-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="ops-btn ops-btn--primary"
            disabled={busy || reply.trim() === ""}
            onClick={() => onSend(reply.trim())}
          >
            {busy ? "Sending..." : "Send reply"}
          </button>
        </footer>
      </div>
    </div>
  );
}
