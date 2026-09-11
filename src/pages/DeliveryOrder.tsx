import { ArrowLeft, Minus, Plus, Search, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SignInModal } from "../components/common";
import type { MenuItem } from "../constants";
import {
  getVisibleCategoryName,
  useDeliveryCategoryDefs,
  useDeliveryMenuItems,
} from "../data/deliveryMenu";
import {
  getDeliveryOrders,
  saveDeliveryOrders,
  type DeliveryOrder as DeliveryOrderData,
} from "../data/delivery";
import { useAuthGate } from "../hooks/useAuthGate";

type Cart = Record<string, number>;

type CustomerDetails = {
  name: string;
  phone: string;
  address: string;
  notes: string;
  payment: string;
};

type FieldKey = "name" | "phone" | "address" | "items";
type OrderErrors = FieldKey[];
type FieldMessages = Partial<Record<FieldKey, string>>;

// Philippine mobile number: 11 digits, starting with 09 (spaces/dashes ignored).
const PH_MOBILE_PATTERN = /^09\d{9}$/;

const EMPTY_DETAILS: CustomerDetails = {
  name: "",
  phone: "",
  address: "",
  notes: "",
  payment: "Cash on delivery",
};

const DELIVERY_FEE = 60;
const MAX_QUANTITY_PER_ITEM = 20;

export function DeliveryOrder() {
  const navigate = useNavigate();
  const { closeSignIn, requireAuth, showSignIn } = useAuthGate();
  const menuItems = useDeliveryMenuItems();
  const categoryDefs = useDeliveryCategoryDefs();
  const [cart, setCart] = useState<Cart>({});
  const [details, setDetails] = useState<CustomerDetails>(EMPTY_DETAILS);
  const [errors, setErrors] = useState<OrderErrors>([]);
  const [fieldMessages, setFieldMessages] = useState<FieldMessages>({});
  const [submittedReference, setSubmittedReference] = useState<string | null>(
    null,
  );
  const [menuSearch, setMenuSearch] = useState("");

  const selectedItems = useMemo(
    () => menuItems.filter((item) => cart[item.id]),
    [menuItems, cart],
  );


  const visibleMenuItems = useMemo(() => {
    const query = menuSearch.trim().toLowerCase();
    if (!query) return menuItems;
    return menuItems.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query),
    );
  }, [menuSearch, menuItems]);

  const totalQuantity = selectedItems.reduce(
    (sum, item) => sum + (cart[item.id] ?? 0),
    0,
  );

  const subtotal = selectedItems.reduce(
    (sum, item) => sum + item.price * (cart[item.id] ?? 0),
    0,
  );
  const deliveryFee = subtotal > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const updateQuantity = (item: MenuItem, quantity: number) => {
    setCart((currentCart) => ({
      ...currentCart,
      [item.id]: Math.max(0, Math.min(MAX_QUANTITY_PER_ITEM, quantity)),
    }));
  };

  const updateDetail = (field: keyof CustomerDetails, value: string) => {
    setDetails((prev) => ({ ...prev, [field]: value }));
  };

  const submitOrder = () => {
    const nextErrors: OrderErrors = [];
    const nextMessages: FieldMessages = {};

    if (!details.name.trim()) {
      nextErrors.push("name");
      nextMessages.name = "Full name is required";
    }

    const phoneDigits = details.phone.replace(/\D/g, "");
    if (!phoneDigits) {
      nextErrors.push("phone");
      nextMessages.phone = "Contact number is required";
    } else if (!PH_MOBILE_PATTERN.test(phoneDigits)) {
      nextErrors.push("phone");
      nextMessages.phone = "Enter an 11-digit number starting with 09";
    }

    if (!details.address.trim()) {
      nextErrors.push("address");
      nextMessages.address = "Delivery address is required";
    }
    if (!selectedItems.length) {
      nextErrors.push("items");
      nextMessages.items = "Select at least one item to order";
    }

    setErrors(nextErrors);
    setFieldMessages(nextMessages);

    if (nextErrors.length > 0) return;
    if (!requireAuth()) return;

    const existingOrders = getDeliveryOrders();
    const reference = `CAP-${1050 + existingOrders.length}`;
    const itemsList = selectedItems.map((it) => ({
      id: it.id,
      type: "packed_meal" as const,
      name: it.name,
      quantity: cart[it.id] ?? 1,
      price: it.price,
      category: it.category,
    }));
    const itemsDisplay = `${totalQuantity} item${totalQuantity === 1 ? "" : "s"} · ₱${total.toLocaleString()}`;
    const order: DeliveryOrderData = {
      reference,
      customer: details.name,
      phone: details.phone,
      address: details.address,
      items: itemsDisplay,
      itemsList,
      subtotal,
      deliveryFee,
      total,
      paymentMethod: details.payment,
      notes: details.notes,
      eta: "Today, 6:30 PM",
      status: "Preparing",
      placedAt: "Just now",
      timeline: [{ status: "Preparing", at: "Just now" }],
    };

    saveDeliveryOrders([...existingOrders, order]);
    setSubmittedReference(reference);
    setCart({});
  };

  if (submittedReference) {
    return (
      <OrderConfirmation
        customerName={details.name}
        reference={submittedReference}
        onPlaceAnother={() => {
          setSubmittedReference(null);
          setDetails(EMPTY_DETAILS);
          setCart({});
        }}
      />
    );
  }

  return (
    <div className="order-page">
      <section className="subpage-hero">
        <h1>Order Delivery</h1>
        <p>Enjoy Capitol favorites at home. Build your order below.</p>
      </section>

      <section className="section order-section">
        <div className="order-content">
          <div className="order-menu">
            <Link className="back-link" to="/delivery">
              <ArrowLeft size={15} />
              Back to delivery tracking
            </Link>

            <div className="order-section-heading">
              <div>
                <p className="eyebrow">Packed meals</p>
                <h2>Choose your dishes</h2>
              </div>
              <span>
                {totalQuantity} item{totalQuantity === 1 ? "" : "s"} selected
              </span>
            </div>

            <label className="order-menu-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search the menu…"
                value={menuSearch}
                onChange={(event) => setMenuSearch(event.target.value)}
              />
            </label>

            {visibleMenuItems.length ? (
              <div className="order-menu-grid">
                {visibleMenuItems.map((item) => (
                  <MenuOrderCard
                    categoryDefs={categoryDefs}
                    item={item}
                    key={item.id}
                    quantity={cart[item.id] ?? 0}
                    onChange={(quantity) => updateQuantity(item, quantity)}
                  />
                ))}
              </div>
            ) : (
              <p className="cart-empty">
                No dishes match &ldquo;{menuSearch}&rdquo;.
              </p>
            )}
          </div>

          <aside className="order-sidebar">
            <OrderSummaryCard
              selectedItems={selectedItems}
              cart={cart}
              subtotal={subtotal}
              deliveryFee={deliveryFee}
              total={total}
            />
            <CustomerFormCard
              details={details}
              errors={errors}
              fieldMessages={fieldMessages}
              total={total}
              onChange={updateDetail}
              onSubmit={submitOrder}
            />
          </aside>
        </div>
      </section>
      {showSignIn && <SignInModal onClose={closeSignIn} />}
    </div>
  );
}

function MenuOrderCard({
  item,
  quantity,
  categoryDefs,
  onChange,
}: {
  item: MenuItem;
  quantity: number;
  categoryDefs: ReturnType<typeof useDeliveryCategoryDefs>;
  onChange: (quantity: number) => void;
}) {
  const isSelected = quantity > 0;

  return (
    <article
      className={`order-menu-card ${quantity ? "order-menu-card--selected" : ""}`}
      key={item.id}
    >
      <div className="order-menu-card__media">
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="order-menu-card__img"
            loading="lazy"
          />
        ) : (
          <div
            className="order-menu-card__img order-menu-card__img--blank"
            aria-label="No image available"
          />
        )}
      </div>

      <div className="order-menu-card__body">
        <div className="order-menu-card__header-row">
          <h2>{item.name}</h2>
          <strong className="order-menu-card__price">₱{item.price}</strong>
        </div>
        <span className="order-menu-card__category">
          {getVisibleCategoryName(item, categoryDefs)}
        </span>
        <p>{item.description}</p>

        <div className="order-menu-card__bottom">
          {isSelected ? (
            <div className="quantity-control">
              <button
                aria-label={`Remove one ${item.name}`}
                onClick={() => onChange(quantity - 1)}
                type="button"
              >
                <Minus size={14} />
              </button>
              <span>{quantity}</span>
              <button
                aria-label={`Add one more ${item.name}`}
                disabled={quantity >= MAX_QUANTITY_PER_ITEM}
                onClick={() => onChange(quantity + 1)}
                type="button"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              className="order-menu-card__add"
              onClick={() => onChange(1)}
              type="button"
            >
              <Plus size={14} />
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function OrderSummaryCard({
  selectedItems,
  cart,
  subtotal,
  deliveryFee,
  total,
}: {
  selectedItems: MenuItem[];
  cart: Cart;
  subtotal: number;
  deliveryFee: number;
  total: number;
}) {
  return (
    <div className="order-summary-card">
      <h2>Your order</h2>

      {selectedItems.length ? (
        <div className="cart-lines">
          {selectedItems.map((item) => {
            const quantity = cart[item.id] ?? 0;
            return (
              <div className="cart-line" key={item.id}>
                <span>
                  {item.name}
                  <small>
                    {item.category} · {quantity} serving{quantity === 1 ? "" : "s"}
                  </small>
                </span>
                <strong>₱{(item.price * quantity).toLocaleString()}</strong>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="cart-empty">Your cart is empty. Add a dish to get started.</p>
      )}

      <div className="summary-total">
        <span>Subtotal</span>
        <span>₱{subtotal.toLocaleString()}</span>
      </div>
      <div className="summary-total">
        <span>Delivery fee</span>
        <span>₱{deliveryFee.toLocaleString()}</span>
      </div>
      <div className="summary-total summary-total--grand">
        <span>Total</span>
        <strong>₱{total.toLocaleString()}</strong>
      </div>
    </div>
  );
}

function SummaryRow({
  grandTotal = false,
  label,
  value,
}: {
  grandTotal?: boolean;
  label: string;
  value: number;
}) {
  return (
    <div
      className={`summary-total ${grandTotal ? "summary-total--grand" : ""}`}
    >
      <span>{label}</span>
      <strong>₱{value.toLocaleString()}</strong>
    </div>
  );
}

function CustomerFormCard({
  details,
  errors,
  fieldMessages,
  total,
  onChange,
  onSubmit,
}: {
  details: CustomerDetails;
  errors: OrderErrors;
  fieldMessages: FieldMessages;
  total: number;
  onChange: (key: keyof CustomerDetails, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="customer-form-card">
      <h2>Delivery details</h2>

      <div className="form-section">
        <div className="form-section-title">Contact Information</div>
        <FormField
          error={errors.includes("name")}
          message={fieldMessages.name}
          label="Full Name"
          name="name"
          placeholder="Juan dela Cruz"
          value={details.name}
          onChange={onChange}
        />
        <FormField
          error={errors.includes("phone")}
          message={fieldMessages.phone}
          label="Contact Number"
          name="phone"
          placeholder="09XX XXX XXXX"
          value={details.phone}
          onChange={onChange}
        />
      </div>

      <div className="form-section">
        <div className="form-section-title">Delivery</div>
        <label
          className={`form-field ${errors.includes("address") ? "form-field--error" : ""}`}
        >
          <span>Delivery Address</span>
          <textarea
            className="input"
            placeholder="House number, street, barangay, city"
            rows={3}
            value={details.address}
            onChange={(event) => onChange("address", event.target.value)}
          />
          {errors.includes("address") && (
            <small className="field-error">{fieldMessages.address}</small>
          )}
        </label>
      </div>

      <div className="form-section">
        <div className="form-section-title">Payment & Notes</div>
        <label className="form-field">
          <span>Payment Method</span>
          <select
            className="input"
            value={details.payment}
            onChange={(event) => onChange("payment", event.target.value)}
          >
            <option>Cash on delivery</option>
            <option>GCash</option>
            <option>Card</option>
          </select>
        </label>

        <label className="form-field">
          <span>
            Notes <em>(optional)</em>
          </span>
          <textarea
            className="input"
            placeholder="Delivery instructions"
            rows={2}
            value={details.notes}
            onChange={(event) => onChange("notes", event.target.value)}
          />
        </label>
      </div>

      {errors.includes("items") && (
        <p className="field-error">{fieldMessages.items}</p>
      )}

      <button
        className="button button--red order-submit"
        onClick={onSubmit}
        type="button"
      >
        Place order · ₱{total.toLocaleString()}
      </button>
    </div>
  );
}

function FormField({
  error,
  message,
  label,
  name,
  placeholder,
  value,
  onChange,
}: {
  error: boolean;
  message?: string;
  label: string;
  name: "name" | "phone";
  placeholder: string;
  value: string;
  onChange: (key: keyof CustomerDetails, value: string) => void;
}) {
  return (
    <label className={`form-field ${error ? "form-field--error" : ""}`}>
      <span>{label}</span>
      <input
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
      />
      {error && <small className="field-error">{message}</small>}
    </label>
  );
}

function OrderConfirmation({
  customerName,
  onPlaceAnother,
  reference,
}: {
  customerName: string;
  onPlaceAnother: () => void;
  reference: string;
}) {
  return (
    <div>
      <section className="page-hero">
        <p className="eyebrow">Order confirmed</p>
        <h1>Thank you, {customerName}.</h1>
        <p>Your Capitol delivery request has been added to the order queue.</p>
      </section>

      <section className="section order-confirmation">
        <div className="confirmation-icon">
          <ShoppingBag size={30} />
        </div>
        <p className="eyebrow">Your tracking reference</p>
        <strong>{reference}</strong>
        <p>
          Keep this reference to check your order progress. Capitol&apos;s staff
          will update its status as it moves through delivery.
        </p>
        <div className="confirmation-actions">
          <Link
            className="button button--red"
            to={`/delivery?reference=${reference}`}
          >
            Track this order
          </Link>
          <button
            className="button button--outline button--outline-light"
            onClick={onPlaceAnother}
            type="button"
          >
            Place another order
          </button>
        </div>
      </section>
    </div>
  );
}
