import type { ReactNode } from "react";

type CheckoutBarProps = {
  visible: boolean;
  summary: ReactNode;
  total: number;
  actionLabel: ReactNode;
  onAction: () => void;
  disabled?: boolean;
  hint?: ReactNode;
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
  mobileOnly = false,
}: CheckoutBarProps) {
  if (!visible) return null;
  const modifier = mobileOnly ? " checkout-bar--mobile-only" : "";

  return (
    <>
      <div className={`checkout-bar-spacer${modifier}`} aria-hidden="true" />
      <div className={`checkout-bar${modifier}`} role="region" aria-label="Order total">
        <div className="checkout-bar__inner">
          <div className="checkout-bar__info">
            <span className="checkout-bar__summary">{summary}</span>
            <strong className="checkout-bar__total">₱{total.toLocaleString()}</strong>
            {hint && <span className="checkout-bar__hint">{hint}</span>}
          </div>
          <button
            className="button button--gold checkout-bar__btn"
            disabled={disabled}
            onClick={onAction}
            type="button"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </>
  );
}
