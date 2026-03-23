import LoadingBrew from "../components/LoadingBrew";
import { useCallback, useEffect, useState } from "react";
import { AUTO_REFRESH_INTERVAL_MS } from "../hooks/usePeriodicRefetch";
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

export default function AdminOrders() {
  const [adminOrders, setAdminOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deliveringOrderId, setDeliveringOrderId] = useState(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState(null);

  const loadOrders = useCallback(async (opts = {}) => {
    const silent = Boolean(opts.silent);
    if (!silent) setLoading(true);
    try {
      const ord = await api("/orders/all", { auth: true });
      setAdminOrders(Array.isArray(ord) ? ord : []);
    } catch {
      if (!silent) {
        setAdminOrders([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders({ silent: false });
  }, [loadOrders]);

  useEffect(() => {
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
  }, [loadOrders]);

  const removeOrderFromList = async (id) => {
    if (
      !window.confirm(
        "Remove this order from the admin list? The customer will still see it in their profile as cancelled (shop reasons). Products and accounts are unchanged.",
      )
    ) {
      return;
    }
    try {
      await api(`/orders/${id}`, { method: "DELETE" });
      showAlert("Removed from list");
      setAdminOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      showAlert(err.message || "Could not remove order");
    }
  };

  const acceptOrderByAdmin = async (id) => {
    setAcceptingOrderId(id);
    try {
      const updated = await api(`/orders/${id}/accept`, { method: "PATCH" });
      setAdminOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                acceptedAt: updated.acceptedAt,
              }
            : o,
        ),
      );
      showAlert("Order accepted — the customer can no longer cancel it from their profile.");
    } catch (err) {
      showAlert(err.message || "Could not accept order");
    } finally {
      setAcceptingOrderId(null);
    }
  };

  const markOrderDelivered = async (id) => {
    setDeliveringOrderId(id);
    try {
      const updated = await api(`/orders/${id}/deliver`, { method: "PATCH" });
      setAdminOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                status: updated.status,
                deliveredAt: updated.deliveredAt,
              }
            : o,
        ),
      );
      showAlert("Order marked as delivered — the customer will see it on their profile.");
    } catch (err) {
      showAlert(err.message || "Could not update order");
    } finally {
      setDeliveringOrderId(null);
    }
  };

  return (
    <section className="menu admin-page page-shell admin-orders-page">
      <div className="section-heading">
        <p className="section-kicker">Operations</p>
        <h2>Orders</h2>
        <p className="section-subtext">
          New orders appear here. Use <strong>Accept order</strong> to confirm you&apos;re preparing
          it — customers can&apos;t cancel after that. Use <strong>Mark delivered</strong> when
          it&apos;s handed off. <strong>Remove</strong> hides a card from this list only (not available
          for delivered orders).{" "}
          <span className="admin-orders-live-hint">
            The list refreshes about every {AUTO_REFRESH_INTERVAL_MS / 1000}s while this tab is open (and
            when you return to the tab).
          </span>
        </p>
      </div>

      {loading && <LoadingBrew className="admin-loading" message="Loading orders…" />}

      {!loading && adminOrders.length === 0 ? (
        <p className="admin-reviews-empty admin-orders-empty">No orders have been placed yet.</p>
      ) : null}

      {!loading && adminOrders.length > 0 ? (
        <div className="admin-orders-stack">
          {adminOrders.map((order) => {
            const customer = order.user;
            const name =
              customer && typeof customer === "object"
                ? customer.name || "Customer"
                : "Customer";
            const email =
              customer && typeof customer === "object" && customer.email ? customer.email : "";
            return (
              <article key={order.id} className="profile-order-card admin-order-card">
                <div className="admin-order-card-top">
                  <p className="admin-order-customer">
                    <strong>{name}</strong>
                    {email ? <span className="admin-order-customer-email"> · {email}</span> : null}
                  </p>
                  <div className="admin-order-card-actions">
                    {order.status !== "cancelled" &&
                    order.status !== "fulfilled" &&
                    !order.acceptedAt ? (
                      <button
                        type="button"
                        className="order-btn admin-inline-btn"
                        disabled={acceptingOrderId === order.id}
                        onClick={() => acceptOrderByAdmin(order.id)}
                      >
                        {acceptingOrderId === order.id ? "Saving…" : "Accept order"}
                      </button>
                    ) : null}
                    {order.status !== "cancelled" && order.status !== "fulfilled" ? (
                      <button
                        type="button"
                        className="add-cart-btn admin-inline-btn"
                        disabled={deliveringOrderId === order.id}
                        onClick={() => markOrderDelivered(order.id)}
                      >
                        {deliveringOrderId === order.id ? "Saving…" : "Mark delivered"}
                      </button>
                    ) : null}
                    {order.status !== "fulfilled" ? (
                      <button
                        type="button"
                        className="danger-btn admin-inline-btn admin-order-delete"
                        onClick={() => removeOrderFromList(order.id)}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
                <header className="profile-order-head">
                  <div>
                    <p className="profile-order-id">
                      Order #{String(order.id).slice(-8).toUpperCase()}
                    </p>
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
                {order.status === "cancelled" && (order.cancelReason || "").trim() ? (
                  <p className="admin-order-cancel-note">
                    {(order.cancelledBy === "user" ? "Customer: " : "") + order.cancelReason.trim()}
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
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
