import { ArrowLeft, Minus, Plus, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PACKED_MENU_ITEMS, type MenuItem } from "../constants";
import {
  getDeliveryOrders,
  saveDeliveryOrders,
  type DeliveryOrder as DeliveryOrderData,
} from "../data/delivery";

type Cart = Record<string, number>;

type CustomerDetails = {
  name: string;
  phone: string;
  address: string;
  notes: string;
  payment: string;
};

type OrderErrors = Array<"name" | "phone" | "address" | "items">;

const EMPTY_DETAILS: CustomerDetails = {
  name: "",
  phone: "",
  address: "",
  notes: "",
  payment: "Cash on delivery",
};

const DELIVERY_FEE = 60;

export function DeliveryOrder() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart>({});
  const [details, setDetails] = useState<CustomerDetails>(EMPTY_DETAILS);
  const [errors, setErrors] = useState<OrderErrors>([]);
  const [submittedReference, setSubmittedReference] = useState<string | null>(
    null,
  );

  const selectedItems = useMemo(
    () => PACKED_MENU_ITEMS.filter((item) => cart[item.id]),
    [cart],
  );

  const subtotal = selectedItems.reduce(
    (total, item) => total + item.price * cart[item.id],
    0,
  );
  const deliveryFee = subtotal > 0 ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  const updateQuantity = (item: MenuItem, quantity: number) => {
    setCart((currentCart) => ({
      ...currentCart,
      [item.id]: Math.max(0, quantity),
    }));
  };

  const updateDetail = (key: keyof CustomerDetails, value: string) => {
    setDetails((currentDetails) => ({
      ...currentDetails,
      [key]: value,
    }));
  };

  const submitOrder = () => {
    const nextErrors: OrderErrors = [];

    if (!details.name.trim()) nextErrors.push("name");
    if (!details.phone.trim()) nextErrors.push("phone");
    if (!details.address.trim()) nextErrors.push("address");
    if (!selectedItems.length) nextErrors.push("items");

    setErrors(nextErrors);

    if (nextErrors.length > 0) return;

    const existingOrders = getDeliveryOrders();
    const reference = `CAP-${1050 + existingOrders.length}`;
    const order: DeliveryOrderData = {
      reference,
      customer: details.name,
      address: details.address,
      items: `${selectedItems.length} menu item${selectedItems.length === 1 ? "" : "s"} · ₱${total.toLocaleString()}`,
      eta: "Today, 6:30 PM",
      status: "Preparing",
      placedAt: "Just now",
    };

    saveDeliveryOrders([...existingOrders, order]);
    setSubmittedReference(reference);
  };

  if (submittedReference) {
    return (
      <OrderConfirmation
        customerName={details.name}
        reference={submittedReference}
        onPlaceAnother={() => navigate("/delivery/order")}
      />
    );
  }

  return (
    <div>
      <section className="page-hero">
        <p className="eyebrow">Capitol Restaurant</p>
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
                {selectedItems.length} item
                {selectedItems.length === 1 ? "" : "s"} selected
              </span>
            </div>

            <div className="order-menu-grid">
              {PACKED_MENU_ITEMS.map((item) => (
                <MenuOrderCard
                  item={item}
                  key={item.id}
                  quantity={cart[item.id] ?? 0}
                  onChange={(quantity) => updateQuantity(item, quantity)}
                />
              ))}
            </div>
          </div>

          <aside className="order-sidebar">
            <OrderSummary
              deliveryFee={deliveryFee}
              items={selectedItems}
              quantities={cart}
              subtotal={subtotal}
              total={total}
            />
            <CustomerForm
              details={details}
              errors={errors}
              total={total}
              onChange={updateDetail}
              onSubmit={submitOrder}
            />
          </aside>
        </div>
      </section>
    </div>
  );
}

function MenuOrderCard({
  item,
  quantity,
  onChange,
}: {
  item: MenuItem;
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  return (
    <article
      className={`order-menu-card ${quantity ? "order-menu-card--selected" : ""}`}
    >
      <div>
        <span className="menu-card__category">{item.category}</span>
        <h2>{item.name}</h2>
        <p>{item.description}</p>
      </div>

      <div className="order-menu-card__bottom">
        <strong>₱{item.price}</strong>
        <div className="quantity-control">
          <button
            aria-label={`Remove one ${item.name}`}
            disabled={!quantity}
            onClick={() => onChange(quantity - 1)}
            type="button"
          >
            <Minus size={14} />
          </button>
          <span>{quantity}</span>
          <button
            aria-label={`Add one ${item.name}`}
            onClick={() => onChange(quantity + 1)}
            type="button"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

function OrderSummary({
  deliveryFee,
  items,
  quantities,
  subtotal,
  total,
}: {
  deliveryFee: number;
  items: MenuItem[];
  quantities: Cart;
  subtotal: number;
  total: number;
}) {
  return (
    <div className="order-summary-card">
      <h2>Your order</h2>

      {items.length > 0 ? (
        <div className="cart-lines">
          {items.map((item) => (
            <div className="cart-line" key={item.id}>
              <span>
                {item.name}
                <small>
                  {quantities[item.id]} × ₱{item.price}
                </small>
              </span>
              <strong>
                ₱{(item.price * quantities[item.id]).toLocaleString()}
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="cart-empty">
          Your cart is empty. Add a dish to get started.
        </p>
      )}

      <SummaryRow label="Subtotal" value={subtotal} />
      <SummaryRow label="Delivery fee" value={deliveryFee} />
      <SummaryRow grandTotal label="Total" value={total} />
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

function CustomerForm({
  details,
  errors,
  total,
  onChange,
  onSubmit,
}: {
  details: CustomerDetails;
  errors: OrderErrors;
  total: number;
  onChange: (key: keyof CustomerDetails, value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="customer-form">
      <h2>Delivery details</h2>

      <FormField
        error={errors.includes("name")}
        label="Full Name"
        name="name"
        placeholder="Juan dela Cruz"
        value={details.name}
        onChange={onChange}
      />
      <FormField
        error={errors.includes("phone")}
        label="Contact Number"
        name="phone"
        placeholder="09XX XXX XXXX"
        value={details.phone}
        onChange={onChange}
      />

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
      </label>

      <label className="form-field">
        <span>Payment Method</span>
        <select
          className="input"
          value={details.payment}
          onChange={(event) => onChange("payment", event.target.value)}
        >
          <option>Cash on delivery</option>
          <option>GCash (mock)</option>
          <option>Card (mock)</option>
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

      {errors.length > 0 && (
        <p className="field-error">
          Please select at least one item and complete the required delivery
          details.
        </p>
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
  label,
  name,
  placeholder,
  value,
  onChange,
}: {
  error: boolean;
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
        <p>
          Your Capitol delivery request has been added to the demo order queue.
        </p>
      </section>

      <section className="section order-confirmation">
        <div className="confirmation-icon">
          <ShoppingBag size={30} />
        </div>
        <p className="eyebrow">Your tracking reference</p>
        <strong>{reference}</strong>
        <p>
          Keep this reference to check your order progress. In this demo, the
          staff page can update its status.
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
