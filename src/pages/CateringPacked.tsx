import { ArrowRight, Check, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarModal, type BookingDetails } from "../components/common";
import { PACKED_MENU_ITEMS, type MenuItem } from "../constants";
import { addCateringBooking, nextCateringId } from "../data/reservations";

export function CateringPacked() {
  const categories = [
    "All",
    ...new Set(PACKED_MENU_ITEMS.map((item) => item.category)),
  ];
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedMeal, setSelectedMeal] = useState<MenuItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const displayItems = useMemo(
    () =>
      activeCategory === "All"
        ? PACKED_MENU_ITEMS
        : PACKED_MENU_ITEMS.filter((item) => item.category === activeCategory),
    [activeCategory],
  );

  const subtotal = selectedMeal ? selectedMeal.price : 0;
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (
        event.target.closest(".menu-card") ||
        event.target.closest(".proceed-bar") ||
        event.target.closest(".calendar-modal-backdrop") ||
        event.target.closest(".filter-row") ||
        event.target.closest(".order-summary-card")
      ) {
        return;
      }
      setSelectedMeal(null);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, []);

  return (
    <div>
      <div className="breadcrumb">
        <Link to="/catering">Catering</Link>
        <ChevronRight size={14} />
        <span>Individually Packed Meals</span>
      </div>
      <section className="subpage-hero">
        <h1>Individually Packed Meals</h1>
        <p>
          Browse our menu, then proceed to select your reservation date and
          time.
        </p>
      </section>
      <section className="section packed-section">
        <div className="filter-row">
          {categories.map((category) => (
            <button
              className={
                activeCategory === category
                  ? "filter-button filter-button--active"
                  : "filter-button"
              }
              key={category}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
        <div className="menu-grid">
          {displayItems.map((item) => (
            <button
              className={`menu-card ${selectedMeal?.id === item.id ? "menu-card--selected" : ""}`}
              key={item.id}
              onClick={() => setSelectedMeal((prev) => (prev?.id === item.id ? null : item))}
              type="button"
            >
              {selectedMeal?.id === item.id && (
                <span className="menu-card__check">
                  <Check size={12} /> Selected
                </span>
              )}
              <div className="menu-card__top">
                <h2>{item.name}</h2>
                <strong>₱{item.price}</strong>
              </div>
              <span className="menu-card__category">{item.category}</span>
              <p>{item.description}</p>
            </button>
          ))}
        </div>

        <div className="packed-order-summary">
          <div className="order-summary-card">
            <h2>Your order</h2>
            {selectedMeal ? (
              <div className="cart-lines">
                <div className="cart-line">
                  <span>
                    {selectedMeal.name}
                    <small>{selectedMeal.category} · 1 serving</small>
                  </span>
                  <strong>₱{selectedMeal.price}</strong>
                </div>
              </div>
            ) : (
              <p className="cart-empty">Your cart is empty. Add a dish to get started.</p>
            )}
            <div className="summary-total">
              <span>Subtotal</span>
              <span>₱{subtotal}</span>
            </div>
            <div className="summary-total">
              <span>Delivery fee</span>
              <span>₱{deliveryFee}</span>
            </div>
            <div className="summary-total summary-total--grand">
              <span>Total</span>
              <strong>₱{total}</strong>
            </div>
          </div>
        </div>

        <div className="proceed-bar">
          <div>
            {selectedMeal ? (
              <>
                <small>Selected meal:</small>
                <strong>
                  {selectedMeal.name} — ₱{selectedMeal.price}
                </strong>
              </>
            ) : (
              <p>Select a meal above to continue (max 1).</p>
            )}
          </div>
          <button
            className="button button--red"
            disabled={!selectedMeal}
            onClick={() => setModalOpen(true)}
            type="button"
          >
            Proceed <ArrowRight size={16} />
          </button>
        </div>
        {submitted && (
          <p className="booking-notice">
            Reservation request submitted for {selectedMeal?.name ?? "packed meals"}. Capitol&apos;s staff
            will contact you to confirm availability.
          </p>
        )}
      </section>
      <CalendarModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={(details: BookingDetails) => {
          if (!selectedMeal) return;
          const now = new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
          addCateringBooking({
            id: nextCateringId(),
            kind: "catering_packed",
            customer: details.name,
            phone: details.contact,
            email: "",
            date: details.date,
            time: details.time,
            status: "Pending",
            placedAt: now,
            timeline: [{ status: "Pending", at: now }],
            notes: `Packed meal: ${selectedMeal.name}`,
            itemsList: [{ id: selectedMeal.id, type: "packed_meal", name: selectedMeal.name, quantity: 1, price: selectedMeal.price, category: selectedMeal.category }],
            guestCount: 1,
            subtotal,
            total,
          });
          setSubmitted(true);
        }}
        title={`Reserve ${selectedMeal?.name ?? "Packed Meals"} Catering`}
      />
    </div>
  );
}
