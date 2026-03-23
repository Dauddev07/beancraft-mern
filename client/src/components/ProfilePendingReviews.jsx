import { useCallback, useEffect, useMemo, useState } from "react";
import { AUTO_REFRESH_INTERVAL_MS } from "../hooks/usePeriodicRefetch";
import { api } from "../utils/api";
import showAlert from "../utils/showAlert";

/** Dismissed by “Remind me later” — order ids only; new deliveries have new ids so the panel returns. */
const DISMISS_ORDER_IDS_KEY = "bc_profile_review_dismissed_order_ids";
const LEGACY_DISMISS_KEY = "bc_profile_reviews_dismiss";

function readDismissedOrderIds() {
  try {
    const raw = sessionStorage.getItem(DISMISS_ORDER_IDS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr.map(String) : []);
  } catch {
    return new Set();
  }
}

function persistDismissedOrderIds(set) {
  sessionStorage.setItem(DISMISS_ORDER_IDS_KEY, JSON.stringify([...set]));
}

function formatDelivered(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ProfilePendingReviews({ ordersSyncKey = "" }) {
  const [orders, setOrders] = useState(null);
  const [dismissedOrderIds, setDismissedOrderIds] = useState(() => readDismissedOrderIds());
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  useEffect(() => {
    sessionStorage.removeItem(LEGACY_DISMISS_KEY);
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await api("/reviews/pending-delivered", { auth: true });
      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch {
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, ordersSyncKey]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      load();
    };

    const intervalId = window.setInterval(tick, AUTO_REFRESH_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        load();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  const visibleOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return orders.filter((o) => !dismissedOrderIds.has(String(o.orderId)));
  }, [orders, dismissedOrderIds]);

  const handleLater = () => {
    if (!orders || orders.length === 0) return;
    setDismissedOrderIds((prev) => {
      const next = new Set(prev);
      for (const o of orders) {
        if (!next.has(String(o.orderId))) {
          next.add(String(o.orderId));
        }
      }
      persistDismissedOrderIds(next);
      return next;
    });
  };

  const submitReview = async (productId) => {
    const rating = ratings[productId];
    if (!rating || rating < 1 || rating > 5) {
      showAlert("Choose a star rating first.");
      return;
    }

    setSubmittingId(productId);
    try {
      await api("/reviews", {
        method: "POST",
        body: {
          productId,
          rating,
          comment: (comments[productId] ?? "").trim(),
        },
      });
      showAlert("Thanks — your review was saved.");
      setRatings((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      setComments((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      await load();
    } catch (err) {
      showAlert(err.message || "Could not save review");
    } finally {
      setSubmittingId(null);
    }
  };

  if (orders === null) {
    return null;
  }

  if (visibleOrders.length === 0) {
    return null;
  }

  return (
    <div className="profile-delivery-reviews" aria-labelledby="profile-delivery-reviews-title">
      <div className="profile-delivery-reviews__head">
        <div>
          <h3 id="profile-delivery-reviews-title">Rate your delivered order</h3>
          <p className="profile-delivery-reviews__lead">
            Your order was completed — tell us how the items were. One short review per product
            (optional comment, then stars and submit). <strong>Remind me later</strong> only hides
            these orders; the next delivered order will show up here again.
          </p>
        </div>
        <button type="button" className="profile-delivery-reviews__later" onClick={handleLater}>
          Remind me later
        </button>
      </div>

      {visibleOrders.map((order) => (
        <div key={order.orderId} className="profile-delivery-reviews__order">
          <p className="profile-delivery-reviews__order-meta">
            Order <span className="profile-delivery-reviews__order-id">#{order.orderId.slice(-8).toUpperCase()}</span>
            {order.deliveredAt ? (
              <>
                {" "}
                · Delivered {formatDelivered(order.deliveredAt)}
              </>
            ) : null}
          </p>
          <ul className="profile-delivery-reviews__items">
            {order.items.map((item) => {
              const pid = item.productId;
              const reviewFieldId = `profile-review-${pid}`;
              const busy = submittingId === pid;
              const selected = ratings[pid] || 0;
              return (
                <li key={`${order.orderId}-${pid}`} className="profile-delivery-reviews__item">
                  <img
                    src={item.image || "/images/Coffee image.jpg"}
                    alt={item.name}
                    className="profile-delivery-reviews__thumb"
                  />
                  <div className="profile-delivery-reviews__item-body">
                    <h4>{item.name}</h4>
                    <p className="profile-delivery-reviews__qty">
                      Qty {item.qty} · ${Number(item.price).toFixed(2)} each
                    </p>
                    <label className="order-review-comment-label" htmlFor={reviewFieldId}>
                      <span>Your review (optional)</span>
                      <textarea
                        id={reviewFieldId}
                        rows={3}
                        maxLength={500}
                        placeholder="Temperature, taste, packaging — anything that helps other guests."
                        value={comments[pid] ?? ""}
                        disabled={busy}
                        onChange={(e) => setComments((prev) => ({ ...prev, [pid]: e.target.value }))}
                      />
                    </label>
                    <div className="rating-stars" role="group" aria-label={`Rate ${item.name}`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`rating-star ${selected >= star ? "is-active" : ""}`}
                          disabled={busy}
                          onClick={() => setRatings((prev) => ({ ...prev, [pid]: star }))}
                          aria-label={`${star} star${star > 1 ? "s" : ""}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="order-btn profile-delivery-reviews__submit"
                      disabled={busy || !selected}
                      onClick={() => submitReview(pid)}
                    >
                      {busy ? "Submitting…" : "Submit review"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
