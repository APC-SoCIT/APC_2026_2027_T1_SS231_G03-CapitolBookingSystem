import { Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarModal } from "../components/common";
import { CATERING_PACKAGES, type CateringPackage } from "../constants";

export function CateringBuffet() {
  const [selected, setSelected] = useState<CateringPackage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/catering">Catering</Link>
        <ChevronRight size={14} />
        <span>Buffet Style</span>
      </div>

      <section className="subpage-hero">
        <h1>Buffet Style Catering</h1>
        <p>Select a package, then proceed to choose your reservation date.</p>
      </section>

      <section className="section buffet-section">
        <div className="package-grid">
          {CATERING_PACKAGES.map((pkg) => (
            <button
              className={`package-card ${selected?.id === pkg.id ? "package-card--selected" : ""}`}
              key={pkg.id}
              onClick={() => setSelected(pkg)}
              type="button"
            >
              {selected?.id === pkg.id && (
                <span className="package-card__badge">
                  <Check size={12} /> Selected
                </span>
              )}
              <h2>{pkg.name}</h2>
              <p className="package-card__price">
                ₱{pkg.pricePerPax.toLocaleString()}{" "}
                <small>/ pax · min. {pkg.minPax}</small>
              </p>
              <div className="package-card__rule" />
              <p>{pkg.description}</p>
              <ul>
                {pkg.inclusions.map((item) => (
                  <li key={item}>
                    <Check size={15} />
                    {item}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        {/* ── Proceed bar ─────────────────────────────────────────── */}
        <div className="proceed-bar-v2">
          <div className="proceed-bar-v2__info">
            {selected ? (
              <>
                <span className="proceed-bar-v2__label">Selected Package</span>
                <span className="proceed-bar-v2__package">{selected.name}</span>
                <span className="proceed-bar-v2__price">
                  ₱{selected.pricePerPax.toLocaleString()} / pax &middot; {selected.minPax}–{selected.maxPax} guests
                </span>
              </>
            ) : (
              <span className="proceed-bar-v2__hint">
                Select a package above to continue
              </span>
            )}
          </div>
          <button
            className="button button--gold proceed-bar-v2__btn"
            disabled={!selected}
            onClick={() => setModalOpen(true)}
            type="button"
          >
            Book This Package
          </button>
        </div>
      </section>

      <CalendarModal
        isOpen={modalOpen}
        minPax={selected?.minPax ?? 50}
        maxPax={selected?.maxPax}
        onClose={() => setModalOpen(false)}
        onConfirm={() => {}}
        title={`Reserve ${selected?.name ?? "Buffet Catering"}`}
      />
    </div>
  );
}
