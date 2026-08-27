import { Minus, Plus, Trash2, Package, UtensilsCrossed } from "lucide-react";
import { CATERING_PACKAGES, PACKED_MENU_ITEMS } from "../../constants";
import type { OrderItem, OrderItemType } from "../../data/delivery";

type Props = {
  items: OrderItem[];
  onChange: (items: OrderItem[]) => void;
};

function makePackageItem(pkgId: string): OrderItem {
  const pkg = CATERING_PACKAGES.find((p) => p.id === pkgId);
  if (!pkg) throw new Error("package not found");
  return {
    id: pkg.id,
    type: "package",
    name: pkg.name,
    quantity: 1,
    price: pkg.pricePerPax,
    pax: pkg.minPax,
  };
}

function makeMealItem(mealId: string): OrderItem {
  const m = PACKED_MENU_ITEMS.find((x) => x.id === mealId);
  if (!m) throw new Error("meal not found");
  return {
    id: m.id,
    type: "packed_meal",
    name: m.name,
    quantity: 1,
    price: m.price,
    category: m.category,
  };
}

export function OrderItemsEditor({ items, onChange }: Props) {
  const update = (idx: number, patch: Partial<OrderItem>) => {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  };

  const remove = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  const add = (type: OrderItemType) => {
    if (type === "package") onChange([...items, makePackageItem("pkg-1")]);
    else onChange([...items, makeMealItem("pm-01")]);
  };

  const changeType = (idx: number, type: OrderItemType) => {
    const it = items[idx];
    if (it.type === type) return;
    if (type === "package") {
      onChange(items.map((x, i) => (i === idx ? makePackageItem("pkg-1") : x)));
    } else {
      onChange(items.map((x, i) => (i === idx ? makeMealItem("pm-01") : x)));
    }
  };

  return (
    <div className="ops-items-editor">
      {items.length === 0 && (
        <p className="ops-items-empty">No items yet. Add a package or packed meal below.</p>
      )}

      {items.map((item, idx) => (
        <div key={idx} className="ops-item-row">
          <div className="ops-item-row__icon">
            {item.type === "package" ? <Package size={16} /> : <UtensilsCrossed size={16} />}
          </div>

          <div className="ops-item-row__main">
            <div className="ops-item-row__top">
              <select
                value={item.type}
                onChange={(e) => changeType(idx, e.target.value as OrderItemType)}
                className="ops-select ops-select--sm"
                aria-label="Item type"
              >
                <option value="package">Catering package</option>
                <option value="packed_meal">Packed meal</option>
              </select>

              {item.type === "package" ? (
                <select
                  value={item.id}
                  onChange={(e) => {
                    const pkg = CATERING_PACKAGES.find((p) => p.id === e.target.value)!;
                    update(idx, { id: pkg.id, name: pkg.name, price: pkg.pricePerPax });
                  }}
                  className="ops-select ops-select--grow"
                >
                  {CATERING_PACKAGES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₱{p.pricePerPax}/pax (min {p.minPax})
                    </option>
                  ))}
                </select>
              ) : (
                <select
                  value={item.id}
                  onChange={(e) => {
                    const m = PACKED_MENU_ITEMS.find((x) => x.id === e.target.value)!;
                    update(idx, { id: m.id, name: m.name, price: m.price, category: m.category });
                  }}
                  className="ops-select ops-select--grow"
                >
                  {PACKED_MENU_ITEMS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — ₱{m.price} · {m.category}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="ops-item-row__bottom">
              {item.type === "package" ? (
                <>
                  <label className="ops-field ops-field--inline">
                    <span>Pax</span>
                    <input
                      type="number"
                      min={10}
                      step={10}
                      value={item.pax ?? 50}
                      onChange={(e) => update(idx, { pax: Math.max(10, Number(e.target.value) || 0) })}
                      className="ops-input ops-input--sm"
                    />
                  </label>
                  <label className="ops-field ops-field--inline">
                    <span>Qty</span>
                    <div className="ops-stepper">
                      <button type="button" onClick={() => update(idx, { quantity: Math.max(1, item.quantity - 1) })}>
                        <Minus size={12} />
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => update(idx, { quantity: item.quantity + 1 })}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </label>
                  <label className="ops-field ops-field--inline">
                    <span>₱/pax</span>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => update(idx, { price: Number(e.target.value) || 0 })}
                      className="ops-input ops-input--sm ops-input--price"
                    />
                  </label>
                  <strong className="ops-item-row__line-total">
                    ₱{(item.price * (item.pax ?? 50) * item.quantity).toLocaleString()}
                  </strong>
                </>
              ) : (
                <>
                  <div className="ops-stepper">
                    <button type="button" onClick={() => update(idx, { quantity: Math.max(1, item.quantity - 1) })}>
                      <Minus size={12} />
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => update(idx, { quantity: item.quantity + 1 })}>
                      <Plus size={12} />
                    </button>
                  </div>
                  <label className="ops-field ops-field--inline">
                    <span>₱ each</span>
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => update(idx, { price: Number(e.target.value) || 0 })}
                      className="ops-input ops-input--sm ops-input--price"
                    />
                  </label>
                  <strong className="ops-item-row__line-total">₱{(item.price * item.quantity).toLocaleString()}</strong>
                </>
              )}
            </div>
          </div>

          <button type="button" className="ops-icon-btn ops-icon-btn--danger" onClick={() => remove(idx)} aria-label="Remove item">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <div className="ops-items-add">
        <button type="button" className="ops-add-btn" onClick={() => add("package")}>
          <Package size={14} /> Add package
        </button>
        <button type="button" className="ops-add-btn" onClick={() => add("packed_meal")}>
          <UtensilsCrossed size={14} /> Add packed meal
        </button>
      </div>
    </div>
  );
}
