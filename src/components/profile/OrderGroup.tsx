import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { StatusPill } from "../operations/StatusPill";

type Props<T extends { id: string; status: string }> = {
  label: string;
  items: T[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  summary: (item: T) => string;
  renderDetail?: (item: T) => ReactNode;
  rowId?: (item: T) => string;
  emptyMessage?: string;
};

export function OrderGroup<T extends { id: string; status: string }>({
  label,
  items,
  activeId,
  onSelect,
  summary,
  renderDetail,
  rowId,
  emptyMessage,
}: Props<T>) {
  return (
    <section className="profile-history__section">
      <p className="eyebrow">
        {label} · {items.length}
      </p>
      {items.length === 0 ? (
        <p className="profile-order-list__empty">{emptyMessage}</p>
      ) : (
        <ul className="profile-order-list">
          {items.map((item) => {
            const open = activeId === item.id;
            return (
              <li key={item.id} id={rowId?.(item)}>
                <button
                  type="button"
                  className={`profile-order-row${open ? " profile-order-row--open" : ""}`}
                  aria-expanded={open}
                  onClick={() => onSelect(open ? null : item.id)}
                >
                  <span className="profile-order-row__body">
                    <strong className="profile-order-row__ref">{summary(item)}</strong>
                    <span className="profile-order-row__meta">{item.id}</span>
                  </span>
                  <StatusPill status={item.status} />
                  <ChevronDown
                    aria-hidden
                    className="profile-order-row__chevron"
                    size={16}
                  />
                </button>
                {open && renderDetail && (
                  <div className="profile-order-row__detail">{renderDetail(item)}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
