import { useParams } from "react-router-dom";
import LoadingBrew from "../components/LoadingBrew";
import { useContext, useEffect, useRef, useState } from "react";
import { usePeriodicRefetch } from "../hooks/usePeriodicRefetch";
import { CartContext } from "../context/cartContextObject";
import { api } from "../utils/api";
import showAlert from "../utils/showAlert";

function Category() {
  const { type } = useParams();
  const { addToCart } = useContext(CartContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refetchTick, setRefetchTick] = useState(0);
  const loadGen = useRef(0);
  const allowCategoryFetchAlert = useRef(true);

  usePeriodicRefetch(setRefetchTick);

  useEffect(() => {
    allowCategoryFetchAlert.current = true;
  }, [type]);

  useEffect(() => {
    const ac = new AbortController();
    const gen = ++loadGen.current;

    if (!type) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);

    (async () => {
      try {
        const data = await api(`/products?category=${encodeURIComponent(type)}`, {
          signal: ac.signal,
        });
        if (gen !== loadGen.current) return;
        setItems(Array.isArray(data) ? data : []);
        allowCategoryFetchAlert.current = false;
      } catch (e) {
        if (e?.name === "AbortError") return;
        if (gen !== loadGen.current) return;
        setItems([]);
        if (allowCategoryFetchAlert.current) {
          showAlert(e.message || "Could not load category");
        }
        allowCategoryFetchAlert.current = false;
      } finally {
        if (gen === loadGen.current) setLoading(false);
      }
    })();

    return () => ac.abort();
  }, [type, refetchTick]);

  return (
    <>
      <section className="menu page-shell">
        <div className="section-heading section-heading--inner">
          <p className="section-kicker">Menu</p>
          <h2>{type} Menu</h2>
        </div>

        {loading && <LoadingBrew className="menu-loading" message="Loading this category…" />}

        <div className="menu-container menu-container--catalog">
          {!loading && items.length === 0 ? (
            <p className="menu-empty">No items available.</p>
          ) : (
            items.map((item) => {
              const out = item.stockStatus === "out_of_stock";
              return (
                <article key={item.id} className="menu-item">
                  <div className="card-media">
                    <img src={item.image} alt={item.name} loading="lazy" />
                  </div>
                  <div className="card-copy">
                    <h3>{item.name}</h3>
                    <p className="price-tag">${Number(item.price).toFixed(2)}</p>
                    {out && <p className="rating">Out of stock</p>}
                  </div>

                  <button
                    type="button"
                    className="add-cart-btn"
                    disabled={out}
                    onClick={() => !out && addToCart(item)}
                  >
                    {out ? "Unavailable" : "Add to Cart"}
                  </button>
                </article>
              );
            })
          )}
        </div>
      </section>
    </>
  );
}

export default Category;
