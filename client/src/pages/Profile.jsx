import LoadingBrew from "../components/LoadingBrew";
import ProfilePendingReviews from "../components/ProfilePendingReviews";
import { AUTO_REFRESH_INTERVAL_MS } from "../hooks/usePeriodicRefetch";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../utils/api";
import showAlert from "../utils/showAlert";

function formatOrderDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function orderStatusLabel(order) {
  const s = order.status;
  if (s === "fulfilled") return "Delivered";
  if (s === "cancelled") return "Cancelled";
  if (s === "paid") return "Paid";
  if (s === "pending" && order.acceptedAt) return "Accepted";
  return "Pending";
}

function orderStatusClass(order) {
  if (order.status === "pending" && order.acceptedAt) return "accepted";
  return order.status || "pending";
}

function Profile() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const loadOrders = useCallback(async (opts = {}) => {
    const silent = Boolean(opts.silent);
    if (!silent) setLoading(true);
    try {
      const data = await api("/orders/my", { auth: true, signal: opts.signal });
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      if (e?.name === "AbortError") return;
      if (!silent) {
        showAlert(e.message || "Could not load your orders");
        setOrders([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return undefined;

    const ac = new AbortController();
    loadOrders({ signal: ac.signal });

    return () => ac.abort();
  }, [user, loadOrders]);

  useEffect(() => {
    if (!user) return undefined;

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      loadOrders({ silent: true });
    };

    const intervalId = window.setInterval(tick, AUTO_REFRESH_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        loadOrders({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user, loadOrders]);

  const ordersSyncKey = useMemo(
    () =>
      orders
        .map((o) => `${o.id}:${o.status}:${o.deliveredAt || ""}:${o.acceptedAt || ""}`)
        .join("|"),
    [orders],
  );

  const cancelOrder = async (orderId) => {
    if (
      !window.confirm(
        "Cancel this order? You can’t undo this. The shop will see it as cancelled.",
      )
    ) {
      return;
    }
    setCancellingId(orderId);
    try {
      await api(`/orders/${orderId}/cancel`, { method: "PATCH" });
      showAlert("Order cancelled");
      await loadOrders({ silent: true });
    } catch (err) {
      showAlert(err.message || "Could not cancel order");
    } finally {
      setCancellingId(null);
    }
  };

  if (!user) {
    return <Navigate to="/login" replace state={{ from: "/profile" }} />;
  }

  return (
    <>
      <section className="profile-page page-shell">
        <div className="section-heading">
          <p className="section-kicker">Your account</p>
          <h2>Profile</h2>
          <p className="section-subtext">
            Account details, delivered-order reviews, and your full order history while signed in.
          </p>
        </div>

        <div className="profile-account-card">
          <h3>Account</h3>
          <dl className="profile-dl">
            <div>
              <dt>Name</dt>
              <dd>{user.name || "—"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email || "—"}</dd>
            </div>
          </dl>
          <Link
            to="/"
            state={{ scrollToId: "categories" }}
            className="shop-btn profile-browse-btn"
          >
            Browse menu
          </Link>
        </div>

        <ProfilePendingReviews ordersSyncKey={ordersSyncKey} />

        <h3 className="profile-orders-title">Order history</h3>
        <p className="profile-orders-lead">
          Orders are listed newest first. You can cancel pending orders until the shop accepts them.
          After that, contact us if you need changes. When your order is delivered, you&apos;ll see
          the date here; the review section above updates automatically.
        </p>

        {loading && (
          <LoadingBrew className="profile-loading" message="Fetching your order history…" />
        )}

        {!loading && orders.length === 0 && (
          <p className="profile-empty">
            You don&apos;t have any orders yet.{" "}
            <Link to="/" state={{ scrollToId: "categories" }}>
              Explore the menu
            </Link>{" "}
            and check out when you&apos;re ready.
          </p>
        )}

        {!loading &&
          orders.length > 0 &&
          orders.map((order) => (
            <article key={order.id} className="profile-order-card">
              <header className="profile-order-head">
                <div>
                  <p className="profile-order-id">Order #{order.id.slice(-8).toUpperCase()}</p>
                  <time className="profile-order-date" dateTime={order.createdAt}>
                    {formatOrderDate(order.createdAt)}
                  </time>
                </div>
                <div className="profile-order-meta">
                  <span
                    className={`profile-order-status profile-order-status--${orderStatusClass(order)}`}
                  >
                    {orderStatusLabel(order)}
                  </span>
                  <span className="profile-order-total">${Number(order.total).toFixed(2)}</span>
                </div>
              </header>
              {order.status === "cancelled" ? (
                <p className="profile-order-cancel-note" role="status">
                  {(order.cancelReason || "").trim() || "This order was cancelled."}
                </p>
              ) : null}
              {order.status === "pending" && order.acceptedAt ? (
                <p className="profile-order-accepted-note" role="status">
                  The shop accepted this order on {formatOrderDate(order.acceptedAt)}. It can no longer
                  be cancelled here.
                </p>
              ) : null}
              {order.status === "fulfilled" ? (
                <p className="profile-order-delivered-note" role="status">
                  {order.deliveredAt
                    ? `Delivered on ${formatOrderDate(order.deliveredAt)}.`
                    : "This order has been delivered."}
                </p>
              ) : null}
              <p className="profile-order-payment">
                Payment: <strong>{order.paymentMethod}</strong>
              </p>
              <ul className="profile-order-items">
                {(order.items || []).map((line, idx) => (
                  <li key={`${order.id}-${idx}`} className="profile-order-line">
                    <img src={line.image || "/images/Coffee image.jpg"} alt={line.name} />
                    <div className="profile-order-line-copy">
                      <span className="profile-order-line-name">{line.name}</span>
                      <span className="profile-order-line-qty">
                        Qty {line.qty} × ${Number(line.price).toFixed(2)}
                      </span>
                    </div>
                    <span className="profile-order-line-sub">
                      ${(Number(line.price) * Number(line.qty)).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              {order.status === "pending" && !order.acceptedAt ? (
                <div className="profile-order-actions">
                  <button
                    type="button"
                    className="danger-btn profile-order-cancel-btn"
                    disabled={cancellingId === order.id}
                    onClick={() => cancelOrder(order.id)}
                  >
                    {cancellingId === order.id ? "Cancelling…" : "Cancel order"}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
      </section>
    </>
  );
}

export default Profile;
