import LoadingBrew from "../components/LoadingBrew";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePeriodicVisibleCallback } from "../hooks/usePeriodicRefetch";
import { api } from "../utils/api";
import showAlert from "../utils/showAlert";

const emptyProductForm = {
  name: "",
  price: "",
  categoryId: "",
  image: "",
  stockStatus: "in_stock",
};

const emptyCategoryForm = { name: "", slug: "", image: "", description: "" };

function Admin() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [adminReviews, setAdminReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categoryForm, setCategoryForm] = useState(emptyCategoryForm);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [editingId, setEditingId] = useState(null);

  const loadAll = useCallback(async (opts = {}) => {
    const silent = Boolean(opts.silent);
    if (!silent) setLoading(true);
    try {
      const [cats, prods] = await Promise.all([api("/categories"), api("/products")]);
      setCategories(cats);
      setProducts(prods);
      try {
        const revs = await api("/reviews/admin", { auth: true });
        setAdminReviews(Array.isArray(revs) ? revs : []);
      } catch {
        setAdminReviews([]);
      }
    } catch (e) {
      if (!silent) {
        showAlert(e.message || "Failed to load admin data");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const silentRefreshAdmin = useCallback(() => {
    loadAll({ silent: true });
  }, [loadAll]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  usePeriodicVisibleCallback(silentRefreshAdmin);

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) {
      showAlert("Category name is required");
      return;
    }
    try {
      const body = {
        name: categoryForm.name.trim(),
        image: categoryForm.image.trim(),
        description: categoryForm.description.trim(),
      };
      const slugTrim = categoryForm.slug.trim();
      if (slugTrim) body.slug = slugTrim;
      if (editingCategoryId) {
        await api(`/categories/${editingCategoryId}`, { method: "PUT", body });
        showAlert("Category updated");
      } else {
        await api("/categories", { method: "POST", body });
        showAlert("Category created");
      }
      setCategoryForm(emptyCategoryForm);
      setEditingCategoryId(null);
      loadAll();
    } catch (err) {
      showAlert(err.message || "Could not save category");
    }
  };

  const startEditCategory = (c) => {
    setEditingCategoryId(c.id);
    setCategoryForm({
      name: c.name || "",
      slug: c.slug || "",
      image: c.image || "",
      description: c.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const { name, price, categoryId, image, stockStatus } = productForm;
    if (!name.trim() || !categoryId || !image.trim() || price === "") {
      showAlert("Fill in name, category, price, and image URL");
      return;
    }
    try {
      const body = {
        name: name.trim(),
        price: Number(price),
        category: categoryId,
        image: image.trim(),
        stockStatus,
      };
      if (editingId) {
        await api(`/products/${editingId}`, { method: "PUT", body });
        showAlert("Product updated");
      } else {
        await api("/products", { method: "POST", body });
        showAlert("Product created");
      }
      setProductForm(emptyProductForm);
      setEditingId(null);
      loadAll();
    } catch (err) {
      showAlert(err.message || "Could not save product");
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    const catId =
      typeof p.category === "object" && p.category?.id
        ? p.category.id
        : p.category;
    setProductForm({
      name: p.name,
      price: String(p.price),
      categoryId: catId,
      image: p.image,
      stockStatus: p.stockStatus || "in_stock",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setProductForm(emptyProductForm);
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api(`/products/${id}`, { method: "DELETE" });
      showAlert("Product deleted");
      if (editingId === id) cancelEdit();
      loadAll();
    } catch (err) {
      showAlert(err.message || "Delete failed");
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm("Delete this category? Products must be moved first.")) return;
    try {
      await api(`/categories/${id}`, { method: "DELETE" });
      showAlert("Category deleted");
      loadAll();
    } catch (err) {
      showAlert(err.message || "Cannot delete category");
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Delete this review? The product’s average rating will be recalculated.")) {
      return;
    }
    try {
      await api(`/reviews/${id}`, { method: "DELETE" });
      showAlert("Review deleted");
      loadAll();
    } catch (err) {
      showAlert(err.message || "Could not delete review");
    }
  };

  const categoryLabel = (p) => {
    if (p.category && typeof p.category === "object") {
      return p.category.name || p.category.slug;
    }
    const found = categories.find((c) => c.id === p.category);
    return found?.name || "—";
  };

  return (
    <>
      <section className="menu admin-page page-shell">
        <div className="section-heading">
          <p className="section-kicker">Operations</p>
          <h2>Admin Panel</h2>
          <p className="section-subtext">
            Manage categories, inventory, catalog details, and reviews. Customer orders are on the{" "}
            <Link to="/admin/orders">Orders</Link> page. Changes apply to the live menu immediately.
          </p>
        </div>

        {loading && (
          <LoadingBrew className="admin-loading" message="Loading your dashboard…" />
        )}

        <div className="admin-grid">
          <div className="admin-card">
            <h3>{editingCategoryId ? "Edit category" : "New category"}</h3>
            <form className="admin-form" onSubmit={handleSaveCategory}>
              <label className="field-group">
                <span>Name</span>
                <input
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Seasonal"
                  required
                />
              </label>
              <label className="field-group">
                <span>Slug (optional when creating)</span>
                <input
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="seasonal"
                />
              </label>
              {editingCategoryId && (
                <p className="admin-hint">
                  Changing the slug updates the public URL (e.g. /menu/your-slug).
                </p>
              )}
              <label className="field-group">
                <span>Description</span>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) =>
                    setCategoryForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Short line for the menu page and home category cards"
                  rows={3}
                  maxLength={400}
                />
              </label>
              <label className="field-group">
                <span>Image URL</span>
                <input
                  value={categoryForm.image}
                  onChange={(e) => setCategoryForm((f) => ({ ...f, image: e.target.value }))}
                  placeholder="/images/..."
                />
              </label>
              <div className="admin-form-actions">
                <button type="submit" className="order-btn">
                  {editingCategoryId ? "Update category" : "Create category"}
                </button>
                {editingCategoryId && (
                  <button type="button" className="danger-btn" onClick={cancelEditCategory}>
                    Cancel edit
                  </button>
                )}
              </div>
            </form>

            <h4 className="admin-subtitle">Existing categories</h4>
            <ul className="admin-list">
              {categories.map((c) => (
                <li key={c.id}>
                  <div className="admin-list-main">
                    <strong>{c.name}</strong>
                    <small>({c.slug})</small>
                    {c.description?.trim() && (
                      <p className="admin-list-desc">{c.description.trim()}</p>
                    )}
                  </div>
                  <div className="admin-list-actions">
                    <button
                      type="button"
                      className="add-cart-btn admin-inline-btn"
                      onClick={() => startEditCategory(c)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="danger-btn admin-inline-btn"
                      onClick={() => deleteCategory(c.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="admin-card">
            <h3>{editingId ? "Edit product" : "Add product"}</h3>
            <form className="admin-form" onSubmit={handleSaveProduct}>
              <label className="field-group">
                <span>Name</span>
                <input
                  value={productForm.name}
                  onChange={(e) => setProductForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <label className="field-group">
                <span>Price</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.price}
                  onChange={(e) => setProductForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
              </label>
              <label className="field-group">
                <span>Category</span>
                <select
                  value={productForm.categoryId}
                  onChange={(e) =>
                    setProductForm((f) => ({ ...f, categoryId: e.target.value }))
                  }
                  required
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-group">
                <span>Image URL</span>
                <input
                  value={productForm.image}
                  onChange={(e) => setProductForm((f) => ({ ...f, image: e.target.value }))}
                  placeholder="/images/..."
                  required
                />
              </label>
              <label className="field-group">
                <span>Stock</span>
                <select
                  value={productForm.stockStatus}
                  onChange={(e) =>
                    setProductForm((f) => ({ ...f, stockStatus: e.target.value }))
                  }
                >
                  <option value="in_stock">In stock</option>
                  <option value="out_of_stock">Out of stock</option>
                </select>
              </label>
              <div className="admin-form-actions">
                <button type="submit" className="order-btn">
                  {editingId ? "Update product" : "Add product"}
                </button>
                {editingId && (
                  <button type="button" className="danger-btn" onClick={cancelEdit}>
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <h3 className="admin-catalog-title">Customer reviews</h3>
        <p className="admin-reviews-intro">
          Remove spam or mistaken ratings. Product averages on the menu update automatically.
        </p>
        {adminReviews.length === 0 ? (
          <p className="admin-reviews-empty">No reviews in the database yet.</p>
        ) : (
          <ul className="admin-reviews-list">
            {adminReviews.map((r) => (
              <li key={r.id} className="admin-review-row">
                <div className="admin-review-main">
                  <div className="admin-review-title-line">
                    <strong>{r.product?.name || "Product"}</strong>
                    <span className="admin-review-stars">{Number(r.rating).toFixed(1)} ★</span>
                  </div>
                  <p className="admin-review-by">
                    {r.user?.name || "Customer"}
                    {r.user?.email ? (
                      <span className="admin-review-email"> · {r.user.email}</span>
                    ) : null}
                    {r.createdAt && (
                      <span className="admin-review-date">
                        {" "}
                        · {new Date(r.createdAt).toLocaleString()}
                      </span>
                    )}
                  </p>
                  {r.comment?.trim() ? (
                    <p className="admin-review-comment">“{r.comment.trim()}”</p>
                  ) : (
                    <p className="admin-review-comment admin-review-comment--empty">No written comment</p>
                  )}
                </div>
                <button
                  type="button"
                  className="danger-btn admin-inline-btn"
                  onClick={() => deleteReview(r.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}

        <h3 className="admin-catalog-title">Catalog</h3>
        <div className="menu-container menu-container--catalog admin-catalog">
          {products.map((item) => (
            <article key={item.id} className="menu-item admin-menu-item">
              <div className="card-media">
                <img src={item.image} alt={item.name} loading="lazy" />
              </div>
              <div className="card-copy">
                <h3>{item.name}</h3>
                <p className="price-tag">${Number(item.price).toFixed(2)}</p>
                <p className="rating">Category: {categoryLabel(item)}</p>
                <p className="rating">
                  Stock:{" "}
                  {item.stockStatus === "out_of_stock" ? "Out of stock" : "In stock"}
                </p>
              </div>

              <div className="admin-item-actions">
                <button type="button" className="add-cart-btn" onClick={() => startEdit(item)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => deleteProduct(item.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export default Admin;
