import { ArrowRight, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarModal } from "../components/common";
import { PACKED_MENU_ITEMS } from "../constants";

export function CateringPacked() {
  const categories = [
    "All",
    ...new Set(PACKED_MENU_ITEMS.map((item) => item.category)),
  ];
  const [activeCategory, setActiveCategory] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const displayItems = useMemo(
    () =>
      activeCategory === "All"
        ? PACKED_MENU_ITEMS
        : PACKED_MENU_ITEMS.filter((item) => item.category === activeCategory),
    [activeCategory],
  );
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
            <article className="menu-card" key={item.id}>
              <div className="menu-card__top">
                <h2>{item.name}</h2>
                <strong>₱{item.price}</strong>
              </div>
              <span className="menu-card__category">{item.category}</span>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        <div className="proceed-bar">
          <p>Ready to reserve your packed meal catering?</p>
          <button
            className="button button--red"
            onClick={() => setModalOpen(true)}
            type="button"
          >
            Proceed <ArrowRight size={16} />
          </button>
        </div>
        {submitted && (
          <p className="booking-notice">
            Reservation request submitted for packed meals. Capitol&apos;s staff
            will contact you to confirm availability.
          </p>
        )}
      </section>
      <CalendarModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={() => setSubmitted(true)}
        title="Reserve Packed Meals Catering"
      />
    </div>
  );
}
