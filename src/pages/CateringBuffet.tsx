import { Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { CATERING_PACKAGES, type CateringPackage } from "../constants";

export function CateringBuffet() {
  const [selected, setSelected] = useState<CateringPackage | null>(null);
  const [submitted, setSubmitted] = useState(false);
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
        <div className="proceed-bar">
          <div>
            {selected ? (
              <>
                <small>Selected package:</small>
                <strong>
                  {selected.name} — ₱{selected.pricePerPax.toLocaleString()}/pax
                </strong>
              </>
            ) : (
              <em>Please select a package to continue.</em>
            )}
          </div>
          <button
            className="button button--red"
            disabled={!selected}
            onClick={() => setSubmitted(true)}
            type="button"
          >
            Proceed →
          </button>
        </div>
        {submitted && (
          <p className="demo-notice">
            Demo reservation started for {selected?.name}. Date and guest
            details will be added in the next booking chunk.
          </p>
        )}
      </section>
    </div>
  );
}
