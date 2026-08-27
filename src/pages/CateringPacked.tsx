import { ArrowRight, ChevronRight, Minus, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarModal,
  SignInModal,
  type BookingDetails,
} from "../components/common";
import {
  PACKED_MEAL_GUIDELINES,
  PACKED_MENU_ITEMS,
  type MenuItem,
} from "../constants";
import { addCateringBooking, nextCateringId } from "../data/reservations";
import { useAuthGate } from "../hooks/useAuthGate";

const MIN_PACKED_MEAL_QUANTITY = 10;

export function CateringPacked() {
  const categories = [
    "All",
    ...new Set(PACKED_MENU_ITEMS.map((item) => item.category)),
  ];
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedMeals, setSelectedMeals] = useState<MenuItem[]>([]);
  const [mealQuantities, setMealQuantities] = useState<Record<string, number>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { closeSignIn, requireAuth, showSignIn } = useAuthGate();

  const displayItems = useMemo(
    () =>
      activeCategory === "All"
        ? PACKED_MENU_ITEMS
        : PACKED_MENU_ITEMS.filter((item) => item.category === activeCategory),
    [activeCategory],
  );

  const totalPacks = selectedMeals.reduce(
    (sum, meal) => sum + (mealQuantities[meal.id] ?? 0),
    0,
  );
  const subtotal = selectedMeals.reduce(
    (sum, meal) => sum + meal.price * (mealQuantities[meal.id] ?? 0),
    0,
  );
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;
  const canProceed = Boolean(
    selectedMeals.length > 0 &&
      selectedMeals.every(
        (meal) => (mealQuantities[meal.id] ?? 0) >= MIN_PACKED_MEAL_QUANTITY,
      ),
  );

  const chooseMeal = (item: MenuItem) => {
    if (selectedMeals.some((meal) => meal.id === item.id)) {
      setSelectedMeals((meals) => meals.filter((meal) => meal.id !== item.id));
      setMealQuantities((quantities) => {
        const next = { ...quantities };
        delete next[item.id];
        return next;
      });
      return;
    }
    setSelectedMeals((meals) => [...meals, item]);
    setMealQuantities((quantities) => ({
      ...quantities,
      [item.id]: MIN_PACKED_MEAL_QUANTITY,
    }));
  };

  const updateMealQuantity = (mealId: string, delta: number) => {
    setMealQuantities((quantities) => ({
      ...quantities,
      [mealId]: Math.max(
        1,
        (quantities[mealId] ?? MIN_PACKED_MEAL_QUANTITY) + delta,
      ),
    }));
  };

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      if (
        event.target.closest(".menu-card") ||
        event.target.closest(".proceed-bar") ||
        event.target.closest(".calendar-modal-backdrop") ||
        event.target.closest(".filter-row") ||
        event.target.closest(".order-summary-card") ||
        event.target.closest(".signin-modal")
      ) {
        return;
      }
      setSelectedMeals([]);
      setMealQuantities({});
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
        <p>{PACKED_MEAL_GUIDELINES.intro}</p>
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
              className={`menu-card ${selectedMeals.some((meal) => meal.id === item.id) ? "menu-card--selected" : ""}`}
              key={item.id}
              onClick={() => chooseMeal(item)}
              type="button"
            >
              <div className="menu-card__top">
                <h2>{item.name}</h2>
                <strong>₱{item.price}</strong>
              </div>
              <span className="menu-card__category">{item.category}</span>
              <p>{item.description}</p>
            </button>
          ))}
        </div>

        <div className="packed-guidelines">
          <h2>Ordering details</h2>
          <ul>
            <li>{PACKED_MEAL_GUIDELINES.minimumOrder}</li>
            <li>{PACKED_MEAL_GUIDELINES.advanceOrder}</li>
            <li>{PACKED_MEAL_GUIDELINES.bulkOrder}</li>
          </ul>
        </div>

        <div className="packed-order-summary">
          <div className="order-summary-card">
            <h2>Your order</h2>
            {selectedMeals.length > 0 ? (
              <div className="cart-lines">
                {selectedMeals.map((meal) => {
                  const quantity = mealQuantities[meal.id] ?? 0;
                  return (
                    <div className="cart-line" key={meal.id}>
                      <span>
                        {meal.name}
                        <small>
                          {meal.category} · {quantity} pack
                          {quantity === 1 ? "" : "s"}
                        </small>
                      </span>
                      <strong>₱{meal.price * quantity}</strong>
                      <div className="quantity-control" aria-label={`${meal.name} quantity`}>
                        <button
                          aria-label={`Remove one ${meal.name}`}
                          disabled={quantity <= 1}
                          onClick={() => updateMealQuantity(meal.id, -1)}
                          type="button"
                        >
                          <Minus size={14} />
                        </button>
                        <span>{quantity}</span>
                        <button
                          aria-label={`Add one ${meal.name}`}
                          onClick={() => updateMealQuantity(meal.id, 1)}
                          type="button"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
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
            {selectedMeals.length > 0 ? (
              <>
                <small>
                  {selectedMeals.length} meal type{selectedMeals.length === 1 ? "" : "s"} selected:
                </small>
                <strong>
                  {totalPacks} packs · ₱{total}
                </strong>
                {!canProceed && (
                  <small className="field-error">
                    Each meal type requires at least {MIN_PACKED_MEAL_QUANTITY} packs.
                  </small>
                )}
              </>
            ) : (
              <p>Select a meal above to continue. Minimum order: 10 packs per kind.</p>
            )}
          </div>
          <button
            className="button button--red"
            disabled={!canProceed}
            onClick={() => {
              if (requireAuth()) setModalOpen(true);
            }}
            type="button"
          >
            Proceed <ArrowRight size={16} />
          </button>
        </div>
        {submitted && (
          <p className="booking-notice">
            Reservation request submitted for {selectedMeals.length} packed meal
            type{selectedMeals.length === 1 ? "" : "s"}. Capitol&apos;s staff will
            contact you to confirm availability.
          </p>
        )}
      </section>
      <CalendarModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={(details: BookingDetails) => {
          if (!canProceed) return;
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
            notes: `Packed meals: ${selectedMeals.map((meal) => `${meal.name} (${mealQuantities[meal.id]} packs)`).join(", ")}`,
            itemsList: selectedMeals.map((meal) => ({ id: meal.id, type: "packed_meal" as const, name: meal.name, quantity: mealQuantities[meal.id], price: meal.price, category: meal.category })),
            guestCount: totalPacks,
            subtotal,
            total,
          });
          setSubmitted(true);
        }}
        initialPax={totalPacks || MIN_PACKED_MEAL_QUANTITY}
        showCount={false}
        title="Reserve Packed Meals Catering"
      />
      {showSignIn && <SignInModal onClose={closeSignIn} />}
    </div>
  );
}
