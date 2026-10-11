import { ChevronUp } from "lucide-react";
import type { ReactNode, RefObject } from "react";

type CheckoutBarProps = {
  visible: boolean;
  summary: ReactNode;
  total: number;
  actionLabel: ReactNode;
  onAction: () => void;
  disabled?: boolean;
  hint?: ReactNode;
  // Tapping the bar (outside the action button) scrolls this into view.
  detailsRef?: RefObject<HTMLElement | null>;
  // Pages with their own sticky summary on desktop only need the bar on phones.
  mobileOnly?: boolean;
};

// Floating bar pinned to the bottom of the screen once something is in the
// order, so the checkout action is always in reach instead of at page bottom.
export function CheckoutBar({
  visible,
  summary,
  total,
  actionLabel,
  onAction,
  disabled = false,
  hint,
  detailsRef,
  mobileOnly = false,
}: CheckoutBarProps) {
  if (!visible) return null;
  const modifier = mobileOnly ? " checkout-bar--mobile-only" : "";

  const scrollToDetails = () => {
    detailsRef?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div className={`checkout-bar-spacer${modifier}`} aria-hidden="true" />
      <div
        className={`checkout-bar${modifier}${detailsRef ? " checkout-bar--clickable" : ""}`}
        onClick={scrollToDetails}
        role="region"
        aria-label="Order total"
      >
        <div className="checkout-bar__inner">
          <button
            className="checkout-bar__info"
            disabled={!detailsRef}
            type="button"
          >
            <span className="checkout-bar__summary">
              {summary}
              {detailsRef && <ChevronUp size={14} aria-hidden="true" />}
            </span>
            <strong className="checkout-bar__total">₱{total.toLocaleString()}</strong>
            {hint && <span className="checkout-bar__hint">{hint}</span>}
          </button>
          <button
            className="button button--gold checkout-bar__btn"
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              onAction();
            }}
            type="button"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </>
  );
}
