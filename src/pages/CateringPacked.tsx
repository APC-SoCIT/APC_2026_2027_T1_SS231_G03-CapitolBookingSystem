import { ChevronRight } from "lucide-react";
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
        <p>Browse our menu, then proceed to select your reservation date and time.</p>
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

        {/* ── Proceed bar ─────────────────────────────────────────── */}
        <div className="proceed-bar-v2">
          <div className="proceed-bar-v2__info">
            <span className="proceed-bar-v2__label">Ready to Book</span>
            <span className="proceed-bar-v2__package">Individually Packed Meals</span>
            <span className="proceed-bar-v2__price">
              Our staff will confirm quantities and pricing after booking.
            </span>
          </div>
          <button
            className="button button--gold proceed-bar-v2__btn"
            onClick={() => setModalOpen(true)}
            type="button"
          >
            Book Now →
          </button>
        </div>
      </section>

      <CalendarModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={() => {}}
        title="Reserve Packed Meals Catering"
      />
    </div>
  );
}
