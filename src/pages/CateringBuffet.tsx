import { Check, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarModal,
  SignInModal,
  type BookingDetails,
} from "../components/common";
import {
  CATERING_PACKAGE_NOTES,
  CATERING_PACKAGES,
  type CateringPackage,
} from "../constants";
import { addCateringBooking, nextCateringId } from "../data/reservations";
import { useAuthGate } from "../hooks/useAuthGate";

export function CateringBuffet() {
  const [selected, setSelected] = useState<CateringPackage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { closeSignIn, requireAuth, showSignIn } = useAuthGate();

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (
        event.target.closest(".package-card") ||
        event.target.closest(".proceed-bar") ||
        event.target.closest(".calendar-modal-backdrop") ||
        event.target.closest(".signin-modal")
      ) {
        return;
      }
      setSelected(null);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);
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
              onClick={() => setSelected((prev) => (prev?.id === pkg.id ? null : pkg))}
              type="button"
            >
              {selected?.id === pkg.id && (
                <span className="package-card__badge">
                  <Check size={12} /> Selected
                </span>
              )}
              <h2>{pkg.name}</h2>
              <p className="package-card__price">
                ₱{pkg.packagePrice.toLocaleString()}{" "}
                <small>/ package · {pkg.servingSize}</small>
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
        <div className="package-notes">
          <strong>Package notes</strong>
          <ul>
            {CATERING_PACKAGE_NOTES.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
        <div className="proceed-bar">
          <div>
            {selected ? (
              <>
                <small>Selected package:</small>
                <strong>
                  {selected.name} · ₱{selected.packagePrice.toLocaleString()}/package
                </strong>
              </>
            ) : (
              <em>Please select a package to continue.</em>
            )}
          </div>
          <button
            className="button button--red"
            disabled={!selected}
            onClick={() => {
              if (requireAuth()) setModalOpen(true);
            }}
            type="button"
          >
            Proceed →
          </button>
        </div>
        {submitted && (
          <p className="booking-notice">
            Reservation request submitted for {selected?.name}. Capitol&apos;s
            staff will contact you to confirm availability.
          </p>
        )}
      </section>
      <CalendarModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={(details: BookingDetails) => {
          if (!selected) return;
          const now = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
          addCateringBooking({
            id: nextCateringId(),
            kind: "catering_buffet",
            customer: details.name,
            phone: details.contact,
            email: "",
            date: details.date,
            time: details.time,
            status: "Pending",
            placedAt: now,
            timeline: [{ status: "Pending", at: now }],
            notes: `${selected.description}`,
            packageId: selected.id,
            packageName: selected.name,
            pax: details.pax,
            packagePrice: selected.packagePrice,
            pricePerPax: selected.packagePrice / details.pax,
            guestCount: details.pax,
            subtotal: selected.packagePrice,
            total: selected.packagePrice,
          });
          setSubmitted(true);
        }}
        initialPax={selected?.minPax ?? 10}
        maxPax={selected?.maxPax ?? 12}
        minPax={selected?.minPax ?? 10}
        title={`Reserve ${selected?.name ?? "Buffet Catering"}`}
      />
      {showSignIn && <SignInModal onClose={closeSignIn} />}
    </div>
  );
}
