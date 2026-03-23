import { useContext, useEffect, useRef, useState } from "react";
import { usePeriodicRefetch } from "../hooks/usePeriodicRefetch";
import LoadingBrew from "./LoadingBrew";
import { CartContext } from "../context/cartContextObject";
import showAlert from "../utils/showAlert";
import { api } from "../utils/api";

function MenuPage({ title, category }) {
  const { addToCart } = useContext(CartContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryDescription, setCategoryDescription] = useState("");
  const [quantities, setQuantities] = useState({});
  const loadGen = useRef(0);
  /** Bumps on interval / tab focus so menu & ratings stay fresh without spamming alerts on poll errors. */
  const [refetchTick, setRefetchTick] = useState(0);
  const allowMenuFetchAlert = useRef(true);

  usePeriodicRefetch(setRefetchTick);

  useEffect(() => {
    allowMenuFetchAlert.current = true;
  }, [category]);

  useEffect(() => {
    const ac = new AbortController();
    const gen = ++loadGen.current;

    setLoading(true);

    const slug = String(category || "")
      .toLowerCase()
      .trim();

    (async () => {
      try {
        const data = await api(
          `/products?category=${encodeURIComponent(slug)}`,
          { signal: ac.signal },
        );
        if (gen !== loadGen.current) return;
        setItems(Array.isArray(data) ? data : []);
        allowMenuFetchAlert.current = false;
      } catch (e) {
        if (e?.name === "AbortError") return;
        if (gen !== loadGen.current) return;
        setItems([]);
        if (allowMenuFetchAlert.current) {
          showAlert(e.message || "Could not load menu");
        }
        allowMenuFetchAlert.current = false;
      } finally {
        if (gen === loadGen.current) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [category, refetchTick]);

  useEffect(() => {
    const slug = String(category || "")
      .toLowerCase()
      .trim();
    if (!slug) {
      setCategoryDescription("");
      return undefined;
    }

    const ac = new AbortController();
    (async () => {
      try {
        const cats = await api("/categories", { signal: ac.signal });
        if (!Array.isArray(cats)) return;
        const found = cats.find((c) => String(c.slug || "").toLowerCase() === slug);
        setCategoryDescription(found?.description?.trim() || "");
      } catch (e) {
        if (e?.name === "AbortError") return;
        setCategoryDescription("");
      }
    })();

    return () => ac.abort();
  }, [category, refetchTick]);

  const updateQuantity = (id, delta) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max((prev[id] || 1) + delta, 1),
    }));
  };

  const requireLogin = () => {
    const user = localStorage.getItem("beancraft_user");

    if (user) {
      return true;
    }

    showAlert("Please login first to add items to cart");

    setTimeout(() => {
      window.location.href = "/login";
    }, 1200);

    return false;
  };

  const handleAddToCart = (item) => {
    if (item.stockStatus === "out_of_stock") {
      return;
    }

    if (!requireLogin()) {
      return;
    }

    const quantity = quantities[item.id] || 1;

    for (let count = 0; count < quantity; count += 1) {
      addToCart(item);
    }

    showAlert(`${quantity} ${item.name} added to cart`);
    setQuantities((prev) => ({ ...prev, [item.id]: 1 }));
  };

  const isOut = (item) => item.stockStatus === "out_of_stock";

  return (
    <>
      <section className="menu page-shell">
        <div className="section-heading section-heading--inner">
          <p className="section-kicker">Freshly brewed</p>
          <h2>{title}</h2>
          <p className="section-subtext">
            {categoryDescription ||
              "Explore curated picks, tune the quantity, and build your order with real cafe-style polish."}
          </p>
        </div>

        <div className="menu-container menu-container--catalog">
          {loading && <LoadingBrew className="menu-loading" message="Pulling the freshest picks…" />}
          {!loading && items.length === 0 && (
            <p className="menu-empty">No items in this category yet.</p>
          )}
          {!loading &&
            items.map((item) => {
              const avgRating = item.averageRating || 0;
              const ratingCount = item.reviewCount || 0;
              const out = isOut(item);

              return (
                <article key={item.id} className="menu-item">
                  <div className="card-media">
                    <img src={item.image} alt={item.name} loading="lazy" />
                    <span
                      className={`card-chip ${out ? "card-chip--stock" : ""}`}
                    >
                      {out ? "Out of Stock" : "Top pick"}
                    </span>
                  </div>
                  <div className="card-copy">
                    <h3>{item.name}</h3>
                    <p className="price-tag">${Number(item.price).toFixed(2)}</p>
                    <p className="rating">
                      {avgRating > 0
                        ? `★ ${avgRating.toFixed(1)} (${ratingCount} ${ratingCount === 1 ? "review" : "reviews"})`
                        : "No ratings yet"}
                    </p>
                  </div>

                  <div
                    className="qty-box"
                    aria-label={`Choose quantity for ${item.name}`}
                  >
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      disabled={out}
                      aria-label={`Decrease quantity for ${item.name}`}
                    >
                      -
                    </button>
                    <span>{quantities[item.id] || 1}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={out}
                      aria-label={`Increase quantity for ${item.name}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="add-cart-btn"
                    disabled={out}
                    onClick={() => handleAddToCart(item)}
                  >
                    {out ? "Unavailable" : "Add to Cart"}
                  </button>
                </article>
              );
            })}
        </div>
      </section>
    </>
  );
}

export default MenuPage;
