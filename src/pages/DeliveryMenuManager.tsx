import {
  ArrowLeft,
  Check,
  Edit3,
  Eye,
  EyeOff,
  Package,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { MenuItem } from "../constants";
import {
  addCategory,
  deleteCategory,
  deleteMenuItem,
  generateMenuItemId,
  getVisibleCategoryName,
  resetCategories,
  resetMenuItems,
  saveMenuItems,
  toggleCategoryHidden,
  updateCategory,
  useDeliveryCategoryDefs,
  useDeliveryMenuItems,
  type CategoryDefinition,
} from "../data/deliveryMenu";

type ModalMode =
  | { kind: "closed" }
  | { kind: "add" }
  | { kind: "edit"; item: MenuItem };

type DeleteTarget = MenuItem | null;

const EMPTY_FORM: MenuItem = {
  id: "",
  name: "",
  description: "",
  price: 0,
  category: "Solo Meals",
  categories: ["Solo Meals"],
  image: "",
};

function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 600;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DeliveryMenuManager() {
  const items = useDeliveryMenuItems();
  const categoryDefs = useDeliveryCategoryDefs();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [modal, setModal] = useState<ModalMode>({ kind: "closed" });
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const categoryDefsMap = useMemo(
    () => new Map(categoryDefs.map((c) => [c.name.toLowerCase(), c.hidden])),
    [categoryDefs],
  );

  const handleReset = () => {
    resetMenuItems();
  };

  const handleSave = (item: MenuItem) => {
    const updated = items.some((i) => i.id === item.id)
      ? items.map((i) => (i.id === item.id ? item : i))
      : [...items, item];
    saveMenuItems(updated);
    setModal({ kind: "closed" });
  };

  const handleDelete = (id: string) => {
    deleteMenuItem(id);
    setDeleteTarget(null);
  };

  const filtered = useMemo(() => {
    let list = items;
    if (categoryFilter !== "All") {
      list = list.filter((item) => {
        const cats =
          item.categories && item.categories.length > 0
            ? item.categories
            : item.category
              ? [item.category]
              : [];
        return cats.some(
          (c) => c.toLowerCase() === categoryFilter.toLowerCase(),
        );
      });
    }
    const query = search.trim().toLowerCase();
    if (query) {
      list = list.filter((item) => {
        const cats =
          item.categories && item.categories.length > 0
            ? item.categories
            : item.category
              ? [item.category]
              : [];
        return (
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          cats.some((c) => c.toLowerCase().includes(query))
        );
      });
    }
    return list;
  }, [items, categoryFilter, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const cats =
        item.categories && item.categories.length > 0
          ? item.categories
          : item.category
            ? [item.category]
            : [];
      for (const cat of cats) {
        counts[cat] = (counts[cat] ?? 0) + 1;
      }
    }
    return counts;
  }, [items]);

  const visibleCount = categoryDefs.filter((c) => !c.hidden).length;

  return (
    <div>
      <section className="section menu-manager-section">
        <Link className="back-link" to="/operations">
          <ArrowLeft size={15} />
          Back to operations
        </Link>

        {/* Toolbar */}
        <div className="menu-manager-toolbar">
          <div>
            <p className="eyebrow">Item management</p>
            <h2>Delivery menu items</h2>
            <small className="menu-manager-hint">
              {items.length} item{items.length !== 1 ? "s" : ""} in{" "}
              {categoryDefs.length} categories ({visibleCount} visible to
              customers) · Changes appear instantly
            </small>
          </div>
          <div className="menu-manager-toolbar__actions">
            <button
              className="button button--red menu-manager-add-btn"
              onClick={() => setModal({ kind: "add" })}
              type="button"
            >
              <Plus size={16} /> Add item
            </button>
            <button
              className="menu-manager-manage-cats-btn"
              onClick={() => setCategoryModalOpen(true)}
              type="button"
              title="Create, edit, or delete categories"
            >
              <Tag size={15} /> Manage categories
            </button>
            <button
              className="reset-button"
              onClick={handleReset}
              type="button"
            >
              <RefreshCw size={15} /> Reset to defaults
            </button>
          </div>
        </div>

        {/* Search + Filter */}
        <div className="menu-manager-controls">
          <label className="dashboard-search menu-manager-search">
            <Search size={16} />
            <input
              aria-label="Search menu items"
              placeholder="Search by name, description, or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <div className="ops-filter-row">
            <button
              className={`ops-filter-chip ${categoryFilter === "All" ? "ops-filter-chip--active" : ""}`}
              onClick={() => setCategoryFilter("All")}
              type="button"
            >
              All <span>{items.length}</span>
            </button>
            {categoryDefs.map((def) => {
              const cat = def.name;
              const count = categoryCounts[cat] ?? 0;
              return (
                <button
                  key={cat}
                  className={`ops-filter-chip ${categoryFilter === cat ? "ops-filter-chip--active" : ""}`}
                  onClick={() => setCategoryFilter(cat)}
                  type="button"
                  title={def.hidden ? `${cat} (Hidden from customers)` : cat}
                >
                  {cat} <span>{count}</span>
                  {def.hidden && (
                    <EyeOff
                      size={11}
                      style={{ opacity: 0.65, marginLeft: 2 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table header */}
        <div className="menu-manager-table-head">
          <span>Photo</span>
          <span>Item</span>
          <span>Categories</span>
          <span>Price</span>
          <span className="menu-manager-table-head__action">Actions</span>
        </div>

        {/* Items list */}
        <div className="menu-manager-items">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <MenuItemRow
                categoryDefsMap={categoryDefsMap}
                item={item}
                key={item.id}
                onDelete={() => setDeleteTarget(item)}
                onEdit={() => setModal({ kind: "edit", item })}
              />
            ))
          ) : (
            <div className="menu-manager-empty">
              <Package size={24} />
              <p>No items match your search.</p>
            </div>
          )}
        </div>
      </section>

      {/* Add / Edit Modal */}
      {modal.kind !== "closed" && (
        <MenuItemModal
          categoryDefs={categoryDefs}
          initial={modal.kind === "edit" ? modal.item : undefined}
          mode={modal.kind}
          onClose={() => setModal({ kind: "closed" })}
          onSave={handleSave}
          onOpenCategories={() => {
            setModal({ kind: "closed" });
            setCategoryModalOpen(true);
          }}
        />
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <DeleteConfirmation
          item={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget.id)}
        />
      )}

      {/* Category Manager Modal */}
      {categoryModalOpen && (
        <CategoryManagerModal
          categoryDefs={categoryDefs}
          items={items}
          onClose={() => setCategoryModalOpen(false)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Row                                                                */
/* ------------------------------------------------------------------ */

function MenuItemRow({
  item,
  categoryDefsMap,
  onEdit,
  onDelete,
}: {
  item: MenuItem;
  categoryDefsMap: Map<string, boolean>;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const categoriesList =
    item.categories && item.categories.length > 0
      ? item.categories
      : item.category
        ? [item.category]
        : [];

  return (
    <article className="menu-manager-row">
      <div className="menu-manager-row__thumb">
        {item.image ? (
          <img src={item.image} alt={item.name} />
        ) : (
          <div className="menu-manager-row__thumb--blank" aria-hidden="true" />
        )}
      </div>
      <div className="menu-manager-row__info">
        <strong>{item.name}</strong>
        <small>{item.description}</small>
      </div>
      <div className="menu-manager-row__category">
        <div className="menu-manager-row__categories-wrap">
          {categoriesList.length > 0 ? (
            categoriesList.map((cat) => {
              const isHidden = categoryDefsMap.get(cat.toLowerCase()) ?? false;
              return (
                <span
                  key={cat}
                  className={`menu-manager-category-pill ${
                    isHidden ? "menu-manager-category-pill--hidden" : ""
                  }`}
                  title={
                    isHidden
                      ? `"${cat}" is hidden from customer delivery menu`
                      : `"${cat}" is visible to customers`
                  }
                >
                  {cat}
                  {isHidden && (
                    <EyeOff
                      size={11}
                      className="menu-manager-pill-hidden-icon"
                    />
                  )}
                </span>
              );
            })
          ) : (
            <span
              className="menu-manager-category-pill menu-manager-category-pill--hidden"
              title="No categories assigned (displays 'Category' placeholder)"
            >
              None (Category)
            </span>
          )}
        </div>
      </div>
      <div className="menu-manager-row__price">
        <strong>₱{item.price.toLocaleString()}</strong>
      </div>
      <div className="menu-manager-row__actions">
        <button
          className="menu-manager-icon-btn menu-manager-icon-btn--edit"
          onClick={onEdit}
          title={`Edit ${item.name}`}
          type="button"
        >
          <Edit3 size={14} />
        </button>
        <button
          className="menu-manager-icon-btn menu-manager-icon-btn--delete"
          onClick={onDelete}
          title={`Delete ${item.name}`}
          type="button"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Add / Edit Modal                                                   */
/* ------------------------------------------------------------------ */

function MenuItemModal({
  categoryDefs,
  initial,
  mode,
  onClose,
  onOpenCategories,
  onSave,
}: {
  categoryDefs: CategoryDefinition[];
  initial?: MenuItem;
  mode: "add" | "edit";
  onClose: () => void;
  onOpenCategories: () => void;
  onSave: (item: MenuItem) => void;
}) {
  const [form, setForm] = useState<MenuItem>(() => {
    if (initial) {
      const categories =
        initial.categories && initial.categories.length > 0
          ? [...initial.categories]
          : initial.category
            ? [initial.category]
            : [];
      return {
        ...initial,
        categories,
      };
    }
    return {
      ...EMPTY_FORM,
      id: generateMenuItemId(),
      categories: ["Solo Meals"],
      category: "Solo Meals",
    };
  });

  const [errors, setErrors] = useState<string[]>([]);

  const update = <K extends keyof MenuItem>(field: K, value: MenuItem[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (catName: string) => {
    setForm((prev) => {
      const current = prev.categories || [];
      const exists = current.includes(catName);
      const updated = exists
        ? current.filter((c) => c !== catName)
        : [...current, catName];
      return {
        ...prev,
        categories: updated,
        category: updated[0] || "",
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processImageFile(file);
      update("image", dataUrl);
    } catch (err) {
      console.error("Failed to process image:", err);
    }
  };

  const submit = () => {
    const nextErrors: string[] = [];
    if (!form.name.trim()) nextErrors.push("name");
    if (!form.description.trim()) nextErrors.push("description");
    if (form.price <= 0) nextErrors.push("price");
    setErrors(nextErrors);
    if (nextErrors.length > 0) return;

    const finalCategories =
      form.categories && form.categories.length > 0 ? form.categories : [];
    const itemToSave: MenuItem = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      category: finalCategories[0] || "Category",
      categories: finalCategories,
    };
    onSave(itemToSave);
  };

  return (
    <div className="ops-modal-backdrop" onClick={onClose}>
      <div
        className="ops-modal menu-manager-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ops-modal__header">
          <div>
            <span className="ops-modal__kicker">
              {mode === "add" ? "New item" : "Editing item"}
            </span>
            <div className="ops-modal__title-row">
              <h2>
                {mode === "add"
                  ? "Add menu item"
                  : `Edit "${initial?.name}"`}
              </h2>
            </div>
            {mode === "edit" && (
              <span className="ops-modal__subtitle">ID: {form.id}</span>
            )}
          </div>
          <button className="ops-modal__close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="ops-modal__body">
          <div className="ops-form-grid">
            <div
              className={`ops-field ${errors.includes("name") ? "ops-field--error" : ""}`}
            >
              <span>Item Name</span>
              <input
                className="ops-input"
                placeholder="e.g. Adobong Manok"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </div>

            <div
              className={`ops-field ${errors.includes("price") ? "ops-field--error" : ""}`}
            >
              <span>Price (₱)</span>
              <input
                className="ops-input"
                min={0}
                placeholder="120"
                type="number"
                value={form.price || ""}
                onChange={(e) =>
                  update("price", Math.max(0, Number(e.target.value)))
                }
              />
            </div>

            {/* Multi-Category Selector */}
            <div className="ops-field ops-field--full">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.4rem",
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  Categories (Select one or more)
                </span>
                <button
                  type="button"
                  onClick={onOpenCategories}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#af0100",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                    fontWeight: 600,
                  }}
                >
                  Manage categories
                </button>
              </div>

              <div className="category-select-tags">
                {categoryDefs.map((def) => {
                  const isSelected = (form.categories || []).includes(def.name);
                  return (
                    <button
                      key={def.name}
                      type="button"
                      className={`category-tag-btn ${
                        isSelected ? "category-tag-btn--selected" : ""
                      } ${def.hidden ? "category-tag-btn--hidden" : ""}`}
                      onClick={() => toggleCategory(def.name)}
                    >
                      {isSelected && <Check size={13} />}
                      <span>{def.name}</span>
                      {def.hidden && (
                        <span
                          className="category-tag-hidden-badge"
                          title="Hidden from delivery menu"
                        >
                          <EyeOff size={11} /> Hidden
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="category-select-hint">
                {(form.categories || []).length === 0 ? (
                  <span style={{ color: "#af0100" }}>
                    ⚠️ No categories selected. In the delivery menu, this item
                    will display "Category".
                  </span>
                ) : (
                  <span>
                    Selected:{" "}
                    <strong>{(form.categories || []).join(", ")}</strong>
                    {(form.categories || []).every((cat) => {
                      const d = categoryDefs.find(
                        (c) => c.name.toLowerCase() === cat.toLowerCase(),
                      );
                      return d?.hidden;
                    }) ? (
                      <span
                        style={{
                          display: "block",
                          marginTop: "0.2rem",
                          color: "#8a6d3b",
                        }}
                      >
                        ℹ️ All selected categories are hidden from customers. This
                        dish will display placeholder "Category" on customer
                        cards.
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "block",
                          marginTop: "0.2rem",
                          color: "#2e7d32",
                        }}
                      >
                        ✓ Customer menu will display:{" "}
                        <strong>
                          {getVisibleCategoryName(form, categoryDefs)}
                        </strong>
                      </span>
                    )}
                  </span>
                )}
              </p>
            </div>

            <div className="ops-field ops-field--full">
              <span>Description</span>
              <textarea
                className={`ops-input ops-input--area ${errors.includes("description") ? "ops-input--error" : ""}`}
                placeholder="Short description of the dish..."
                rows={3}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </div>

            <div className="ops-field ops-field--full">
              <span>Dish Photo (optional)</span>
              <div className="menu-manager-upload-area">
                {form.image ? (
                  <div className="menu-manager-preview-wrap">
                    <img
                      src={form.image}
                      alt={form.name || "Preview"}
                      className="menu-manager-preview-img"
                    />
                    <div className="menu-manager-preview-actions">
                      <label className="menu-manager-change-btn">
                        <Upload size={14} /> Change photo
                        <input
                          type="file"
                          accept="image/*"
                          className="menu-manager-file-input"
                          onChange={handleFileChange}
                        />
                      </label>
                      <button
                        type="button"
                        className="menu-manager-remove-img-btn"
                        onClick={() => update("image", "")}
                      >
                        <X size={14} /> Remove photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="menu-manager-file-label">
                    <input
                      type="file"
                      accept="image/*"
                      className="menu-manager-file-input"
                      onChange={handleFileChange}
                    />
                    <Upload size={20} />
                    <span>Upload dish photo</span>
                    <small>
                      Click to browse (PNG, JPG, WebP — auto-optimized)
                    </small>
                  </label>
                )}
              </div>
            </div>
          </div>

          {errors.length > 0 && (
            <p className="field-error" style={{ marginTop: "0.75rem" }}>
              Please fill in all required fields (name, description, and a price
              greater than 0).
            </p>
          )}
        </div>

        <div className="ops-modal__footer">
          <button
            className="ops-btn ops-btn--ghost"
            onClick={onClose}
            type="button"
          >
            Cancel
          </button>
          <button
            className="ops-btn ops-btn--primary"
            onClick={submit}
            type="button"
          >
            {mode === "add" ? "Add item" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Category Manager Modal                                             */
/* ------------------------------------------------------------------ */

function CategoryManagerModal({
  categoryDefs,
  items,
  onClose,
}: {
  categoryDefs: CategoryDefinition[];
  items: MenuItem[];
  onClose: () => void;
}) {
  const [newCatName, setNewCatName] = useState("");
  const [newCatHidden, setNewCatHidden] = useState(false);
  const [addError, setAddError] = useState("");
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editError, setEditError] = useState("");
  const [deletingCat, setDeletingCat] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState<string>("");

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const item of items) {
      const cats =
        item.categories && item.categories.length > 0
          ? item.categories
          : item.category
            ? [item.category]
            : [];
      for (const cat of cats) {
        c[cat] = (c[cat] ?? 0) + 1;
      }
    }
    return c;
  }, [items]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setAddError("Please enter a category name");
      return;
    }
    const success = addCategory(trimmed, newCatHidden);
    if (!success) {
      setAddError(`Category "${trimmed}" already exists`);
      return;
    }
    setNewCatName("");
    setNewCatHidden(false);
    setAddError("");
  };

  const handleToggleHidden = (catName: string) => {
    toggleCategoryHidden(catName);
  };

  const startEdit = (cat: string) => {
    setEditingCat(cat);
    setEditName(cat);
    setEditError("");
    setDeletingCat(null);
  };

  const handleSaveEdit = (oldName: string) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError("Category name cannot be empty");
      return;
    }
    if (trimmed.toLowerCase() === oldName.toLowerCase()) {
      setEditingCat(null);
      return;
    }
    const success = updateCategory(oldName, trimmed);
    if (!success) {
      setEditError(`Category "${trimmed}" already exists`);
      return;
    }
    setEditingCat(null);
    setEditError("");
  };

  const startDelete = (cat: string) => {
    setDeletingCat(cat);
    setEditingCat(null);
    const other =
      categoryDefs.find((c) => c.name !== cat)?.name || "";
    setReassignTo(other);
  };

  const handleConfirmDelete = (cat: string) => {
    deleteCategory(cat, reassignTo);
    setDeletingCat(null);
  };

  const handleReset = () => {
    resetCategories();
    setEditingCat(null);
    setDeletingCat(null);
  };

  return (
    <div className="ops-modal-backdrop" onClick={onClose}>
      <div
        className="ops-modal category-manager-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ops-modal__header">
          <div>
            <span className="ops-modal__kicker">Category Management</span>
            <h2>Manage Categories</h2>
            <span className="ops-modal__subtitle">
              Create, rename, hide, or delete categories. Hidden categories
              are not shown in the customer delivery menu.
            </span>
          </div>
          <button className="ops-modal__close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="ops-modal__body">
          {/* Add Category */}
          <form onSubmit={handleAdd}>
            <div className="category-add-form">
              <input
                className="ops-input"
                placeholder="New category name (e.g. Seafood, Beverages)..."
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  setAddError("");
                }}
              />
              <button className="button button--red" type="submit">
                <Plus size={16} /> Add
              </button>
            </div>
            <label className="category-add-options">
              <input
                type="checkbox"
                checked={newCatHidden}
                onChange={(e) => setNewCatHidden(e.target.checked)}
              />
              <span>Hide this category from customer delivery orders menu</span>
            </label>
          </form>
          {addError && (
            <p className="field-error" style={{ marginBottom: "0.85rem" }}>
              {addError}
            </p>
          )}

          {/* Categories List */}
          <div className="category-items-list">
            {categoryDefs.map((def) => {
              const cat = def.name;
              const itemCount = counts[cat] ?? 0;
              const isEditing = editingCat === cat;
              const isDeleting = deletingCat === cat;

              if (isEditing) {
                return (
                  <div
                    key={cat}
                    className="category-item-row category-item-row--editing"
                  >
                    <div className="category-inline-edit">
                      <input
                        className="ops-input"
                        autoFocus
                        value={editName}
                        onChange={(e) => {
                          setEditName(e.target.value);
                          setEditError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit(cat);
                          if (e.key === "Escape") setEditingCat(null);
                        }}
                      />
                      <button
                        type="button"
                        className="ops-btn ops-btn--primary ops-btn--sm"
                        onClick={() => handleSaveEdit(cat)}
                      >
                        <Check size={14} /> Save
                      </button>
                      <button
                        type="button"
                        className="ops-btn ops-btn--ghost ops-btn--sm"
                        onClick={() => setEditingCat(null)}
                      >
                        Cancel
                      </button>
                    </div>
                    {editError && (
                      <p
                        className="field-error"
                        style={{ marginTop: "0.35rem" }}
                      >
                        {editError}
                      </p>
                    )}
                  </div>
                );
              }

              if (isDeleting) {
                const otherCats = categoryDefs
                  .filter((c) => c.name !== cat)
                  .map((c) => c.name);
                return (
                  <div
                    key={cat}
                    className="category-item-row category-item-row--deleting"
                  >
                    <div className="category-delete-box">
                      <strong style={{ color: "#af0100" }}>
                        Delete "{cat}" category?
                      </strong>
                      {itemCount > 0 ? (
                        <div style={{ marginTop: "0.5rem" }}>
                          <p
                            style={{
                              margin: "0 0 0.5rem",
                              fontSize: "0.82rem",
                              color: "#6a4a4a",
                            }}
                          >
                            <strong>
                              {itemCount} dish{itemCount !== 1 ? "es" : ""}
                            </strong>{" "}
                            currently {itemCount === 1 ? "has" : "have"} this
                            category. Reassign to:
                          </p>
                          <select
                            className="ops-select"
                            value={reassignTo}
                            onChange={(e) => setReassignTo(e.target.value)}
                            style={{ marginBottom: "0.75rem" }}
                          >
                            {otherCats.map((c) => (
                              <option key={c} value={c}>
                                Reassign to {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <p
                          style={{
                            margin: "0.35rem 0 0.75rem",
                            fontSize: "0.82rem",
                            color: "#6a4a4a",
                          }}
                        >
                          No dishes are in this category. It will be removed
                          safely.
                        </p>
                      )}
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <button
                          type="button"
                          className="ops-btn ops-btn--danger ops-btn--sm"
                          onClick={() => handleConfirmDelete(cat)}
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          className="ops-btn ops-btn--ghost ops-btn--sm"
                          onClick={() => setDeletingCat(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={cat} className="category-item-row">
                  <div className="category-item-left">
                    <span className="category-item-badge">{cat}</span>
                    <span className="category-item-count">
                      {itemCount} item{itemCount !== 1 ? "s" : ""}
                    </span>
                    <span
                      className={`category-visibility-badge ${
                        def.hidden
                          ? "category-visibility-badge--hidden"
                          : "category-visibility-badge--visible"
                      }`}
                    >
                      {def.hidden ? <EyeOff size={11} /> : <Eye size={11} />}
                      {def.hidden ? "Hidden" : "Visible"}
                    </span>
                  </div>
                  <div className="category-item-actions">
                    <button
                      className={`category-visibility-btn ${
                        def.hidden ? "category-visibility-btn--hidden" : ""
                      }`}
                      onClick={() => handleToggleHidden(cat)}
                      title={
                        def.hidden
                          ? `Click to make "${cat}" visible on customer delivery menu`
                          : `Click to hide "${cat}" from customer delivery menu`
                      }
                      type="button"
                    >
                      {def.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      className="menu-manager-icon-btn menu-manager-icon-btn--edit"
                      onClick={() => startEdit(cat)}
                      title={`Rename "${cat}"`}
                      type="button"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className="menu-manager-icon-btn menu-manager-icon-btn--delete"
                      disabled={categoryDefs.length <= 1}
                      onClick={() => startDelete(cat)}
                      title={
                        categoryDefs.length <= 1
                          ? "Cannot delete the last category"
                          : `Delete "${cat}"`
                      }
                      type="button"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className="ops-modal__footer"
          style={{ justifyContent: "space-between" }}
        >
          <button
            className="reset-button"
            onClick={handleReset}
            type="button"
          >
            <RefreshCw size={14} /> Reset categories to defaults
          </button>
          <button
            className="ops-btn ops-btn--primary"
            onClick={onClose}
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Delete Confirmation                                                */
/* ------------------------------------------------------------------ */

function DeleteConfirmation({
  item,
  onCancel,
  onConfirm,
}: {
  item: MenuItem;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="ops-modal-backdrop" onClick={onCancel}>
      <div
        className="ops-modal menu-manager-delete-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ops-modal__header">
          <div>
            <span className="ops-modal__kicker">Confirm Deletion</span>
            <h2>Delete Menu Item?</h2>
          </div>
          <button className="ops-modal__close" onClick={onCancel} type="button">
            <X size={18} />
          </button>
        </div>

        <div className="ops-modal__body">
          <p className="menu-manager-delete-msg">
            Are you sure you want to delete <strong>"{item.name}"</strong>?
          </p>
          <p className="menu-manager-delete-hint">
            This item will be removed from both the manager and customer delivery
            menus. You can restore default items at any time using "Reset to
            defaults".
          </p>
        </div>

        <div className="ops-modal__footer">
          <button
            className="ops-btn ops-btn--ghost"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className="ops-btn ops-btn--danger"
            onClick={onConfirm}
            type="button"
          >
            <Trash2 size={14} /> Delete Item
          </button>
        </div>
      </div>
    </div>
  );
}
