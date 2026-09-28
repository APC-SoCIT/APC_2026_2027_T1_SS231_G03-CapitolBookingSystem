import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, Search, ShoppingBag, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { useAuth } from "../context/AuthContext";
import { getStoredContact } from "../lib/contact";

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

type ProductGroup = {
  kind: "group";
  key: string;
  name: string;
  category: string;
  description: string;
  minPrice: number;
  selectedQty: number;
  variants: MenuItem[];
};

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
  const { user } = useAuth();
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
  const [activeCategory, setActiveCategory] = useState("All");
  const [variantProduct, setVariantProduct] = useState<ProductGroup | null>(
    null,
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [awaitingSignIn, setAwaitingSignIn] = useState(false);

  // Autofill name + previously used contact number once the session is known.
  useEffect(() => {
    if (!user) return;
    setDetails((prev) => ({
      ...prev,
      name: prev.name || user.displayName,
      phone: prev.phone || getStoredContact(user.id),
    }));
  }, [user]);

  // Guest placed an order, signed in, and closed the sign-in dialog:
  // continue straight into the details modal instead of a second click.
  const handleCloseSignIn = useCallback(() => {
    if (awaitingSignIn) {
      setAwaitingSignIn(false);
      closeSignIn();
      if (user) setShowDetailsModal(true);
      return;
    }
    closeSignIn();
  }, [awaitingSignIn, closeSignIn, user]);

  const selectedItems = useMemo(
    () => menuItems.filter((item) => cart[item.id]),
    [menuItems, cart],
  );


  const visibleMenuItems = useMemo(() => {
    let items = menuItems;
    if (activeCategory !== "All") {
      items = items.filter((item) => item.category === activeCategory);
    }
    const query = menuSearch.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.variantGroup ?? "").toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query),
    );
  }, [activeCategory, menuSearch, menuItems]);

  // Variant items (Half/Whole, Bilao sizes) collapse into one product card each.
  type Product =
    | { kind: "single"; key: string; item: MenuItem }
    | ProductGroup;
  const products = useMemo<Product[]>(() => {
    const out: Product[] = [];
    const groupIndex = new Map<string, ProductGroup>();
    for (const item of visibleMenuItems) {
      if (item.variantGroup) {
        const existing = groupIndex.get(item.variantGroup);
        if (existing) {
          existing.variants.push(item);
        } else {
          const group: ProductGroup = {
            kind: "group",
            key: item.variantGroup,
            name: item.variantGroup,
            category: item.category,
            description: item.description,
            minPrice: item.price,
            selectedQty: 0,
            variants: [item],
          };
          groupIndex.set(item.variantGroup, group);
          out.push(group);
        }
      } else {
        out.push({ kind: "single", key: item.id, item });
      }
    }
    for (const group of groupIndex.values()) {
      group.minPrice = Math.min(...group.variants.map((v) => v.price));
      group.selectedQty = group.variants.reduce(
        (sum, v) => sum + (cart[v.id] ?? 0),
        0,
      );
    }
    return out;
  }, [visibleMenuItems, cart]);

  // Show six dishes at a time so the page doesn't stretch on big menus.
  const MENU_PAGE_SIZE = 6;
  const [menuPage, setMenuPage] = useState(1);
  const menuPageCount = Math.ceil(products.length / MENU_PAGE_SIZE) || 1;
  const shownProducts = products.slice(
    (menuPage - 1) * MENU_PAGE_SIZE,
    menuPage * MENU_PAGE_SIZE,
  );

  const visibleCategories = useMemo(
    () => categoryDefs.filter((def) => !def.hidden).map((def) => def.name),
    [categoryDefs],
  );

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
    if (errors.includes(field as FieldKey)) {
      setErrors((prev) => prev.filter((key) => key !== field));
    }
  };

  const openDetailsModal = () => {
    if (!selectedItems.length) {
      setErrors(["items"]);
      setFieldMessages({ items: "Select at least one item to order" });
      return;
    }
    setErrors((prev) => prev.filter((key) => key !== "items"));
    setFieldMessages((prev) => {
      const { items: _dropped, ...rest } = prev;
      return rest;
    });

    if (!user) {
      setAwaitingSignIn(true);
      setShowDetailsModal(false);
      requireAuth();
      return;
    }
    setShowDetailsModal(true);
  };

  const handleConfirmDetails = () => {
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

    setErrors(nextErrors);
    setFieldMessages(nextMessages);

    if (nextErrors.length > 0) return;

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
    setShowDetailsModal(false);
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
              Back
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
                onChange={(event) => {
                  setMenuSearch(event.target.value);
                  setMenuPage(1);
                }}
              />
            </label>

            <div className="order-filter-row" role="group" aria-label="Filter by category">
              <button
                className={`ops-filter-chip ${activeCategory === "All" ? "ops-filter-chip--active" : ""}`}
                onClick={() => {
                  setActiveCategory("All");
                  setMenuPage(1);
                }}
                type="button"
              >
                All
              </button>
              {visibleCategories.map((name) => (
                <button
                  className={`ops-filter-chip ${activeCategory === name ? "ops-filter-chip--active" : ""}`}
                  key={name}
                  onClick={() => {
                    setActiveCategory(name);
                    setMenuPage(1);
                  }}
                  type="button"
                >
                  {name}
                </button>
              ))}
            </div>

            {products.length ? (
              <>
                <div className="order-menu-grid">
                  {shownProducts.map((product) =>
                    product.kind === "single" ? (
                      <MenuOrderCard
                        categoryDefs={categoryDefs}
                        item={product.item}
                        key={product.key}
                        quantity={cart[product.item.id] ?? 0}
                        onChange={(quantity) => updateQuantity(product.item, quantity)}
                      />
                    ) : (
                      <VariantGroupCard
                        product={product}
                        key={product.key}
                        categoryDefs={categoryDefs}
                        onOpen={() => setVariantProduct(product)}
                      />
                    ),
                  )}
                </div>
                {menuPageCount > 1 && (
                  <div className="order-menu-pager">
                    <button
                      aria-label="Previous dishes"
                      disabled={menuPage <= 1}
                      onClick={() => setMenuPage((page) => Math.max(1, page - 1))}
                      type="button"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="order-menu-pager__page">
                      Page {menuPage} of {menuPageCount}
                    </span>
                    <button
                      aria-label="Next dishes"
                      disabled={menuPage >= menuPageCount}
                      onClick={() => setMenuPage((page) => Math.min(menuPageCount, page + 1))}
                      type="button"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
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
            <button
              className="button button--red order-submit"
              onClick={openDetailsModal}
              type="button"
            >
              Place order · ₱{total.toLocaleString()}
            </button>
            {errors.includes("items") && (
              <p className="field-error order-sidebar__error" role="alert">
                {fieldMessages.items}
              </p>
            )}
          </aside>
        </div>
      </section>
      {showDetailsModal && (
        <DeliveryDetailsModal
          details={details}
          errors={errors}
          fieldMessages={fieldMessages}
          total={total}
          onClose={() => setShowDetailsModal(false)}
          onChange={updateDetail}
          onConfirm={handleConfirmDetails}
        />
      )}
      {variantProduct && (
        <VariantPickerModal
          product={variantProduct}
          cart={cart}
          onClose={() => setVariantProduct(null)}
          onChange={updateQuantity}
        />
      )}
      {showSignIn && <SignInModal onClose={handleCloseSignIn} />}
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

function VariantGroupCard({
  product,
  categoryDefs,
  onOpen,
}: {
  product: ProductGroup;
  categoryDefs: ReturnType<typeof useDeliveryCategoryDefs>;
  onOpen: () => void;
}) {
  return (
    <article className="order-menu-card" key={product.key}>
      <div className="order-menu-card__media">
        <div
          className="order-menu-card__img order-menu-card__img--blank"
          aria-label="No image available"
        />
      </div>

      <div className="order-menu-card__body">
        <div className="order-menu-card__header-row">
          <h2>{product.name}</h2>
          <strong className="order-menu-card__price">
            from ₱{product.minPrice.toLocaleString()}
          </strong>
        </div>
        <span className="order-menu-card__category">
          {getVisibleCategoryName(product.variants[0], categoryDefs)}
        </span>
        <p>{product.description}</p>

        <div className="order-menu-card__bottom">
          {product.selectedQty > 0 && (
            <span className="order-menu-card__count">
              {product.selectedQty} selected
            </span>
          )}
          <button
            className="order-menu-card__add"
            onClick={onOpen}
            type="button"
          >
            <Plus size={14} />
            {product.selectedQty > 0 ? "Options" : "Add"}
          </button>
        </div>
      </div>
    </article>
  );
}

function VariantPickerModal({
  product,
  cart,
  onClose,
  onChange,
}: {
  product: ProductGroup;
  cart: Cart;
  onClose: () => void;
  onChange: (item: MenuItem, quantity: number) => void;
}) {
  useEffect(() => {
    document.body.classList.add("modal-open");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const totalSelected = product.variants.reduce(
    (sum, variant) => sum + (cart[variant.id] ?? 0),
    0,
  );

  return (
    <div className="signin-backdrop" onClick={onClose}>
      <div
        className="variant-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Choose an option for ${product.name}`}
      >
        <button
          className="signin-modal__close"
          onClick={onClose}
          type="button"
          aria-label="Close options"
        >
          <X size={18} />
        </button>

        <div className="signin-modal__header">
          <div className="signin-modal__header-icon">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="eyebrow">Choose an option</p>
            <h2>{product.name}</h2>
          </div>
        </div>

        <div className="variant-modal__body">
          {product.variants.map((variant) => {
            const quantity = cart[variant.id] ?? 0;
            return (
              <div className="variant-option" key={variant.id}>
                <div className="variant-option__info">
                  <strong>{variant.variantLabel}</strong>
                  <span>₱{variant.price.toLocaleString()}</span>
                </div>
                {quantity > 0 ? (
                  <div className="quantity-control">
                    <button
                      aria-label={`Remove one ${variant.name}`}
                      onClick={() => onChange(variant, quantity - 1)}
                      type="button"
                    >
                      <Minus size={14} />
                    </button>
                    <span>{quantity}</span>
                    <button
                      aria-label={`Add one more ${variant.name}`}
                      disabled={quantity >= MAX_QUANTITY_PER_ITEM}
                      onClick={() => onChange(variant, quantity + 1)}
                      type="button"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    className="order-menu-card__add"
                    onClick={() => onChange(variant, 1)}
                    type="button"
                  >
                    <Plus size={14} />
                    Add
                  </button>
                )}
              </div>
            );
          })}

          <button
            className="button button--red variant-modal__done"
            onClick={onClose}
            type="button"
            disabled={totalSelected === 0}
          >
            {totalSelected > 0 ? `Done · ${totalSelected} selected` : "Done"}
          </button>
        </div>
      </div>
    </div>
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

function DeliveryDetailsModal({
  details,
  errors,
  fieldMessages,
  total,
  onClose,
  onChange,
  onConfirm,
}: {
  details: CustomerDetails;
  errors: OrderErrors;
  fieldMessages: FieldMessages;
  total: number;
  onClose: () => void;
  onChange: (key: keyof CustomerDetails, value: string) => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    document.body.classList.add("modal-open");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="signin-backdrop" onClick={onClose}>
      <div
        className="delivery-details-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Delivery details"
      >
        <button
          className="signin-modal__close"
          onClick={onClose}
          type="button"
          aria-label="Close delivery details"
        >
          <X size={18} />
        </button>

        <div className="signin-modal__header">
          <div className="signin-modal__header-icon">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="eyebrow">Capitol Restaurant</p>
            <h2>Delivery details</h2>
          </div>
        </div>

        <div className="delivery-details-modal__body">
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

          <button
            className="button button--red order-submit"
            onClick={onConfirm}
            type="button"
          >
            Place order · ₱{total.toLocaleString()}
          </button>
        </div>
      </div>
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
            to={`/profile?reference=${reference}`}
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
