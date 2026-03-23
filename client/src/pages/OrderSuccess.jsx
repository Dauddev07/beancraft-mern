import { useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const orderData = location.state;

  if (!orderData) {
    return (
      <>
        <section className="order-success">
          <div className="success-banner">
            <p className="section-kicker">Order status</p>
            <h2>No order found</h2>
            <button type="button" className="order-btn" onClick={() => navigate("/")}>
              Go Home
            </button>
          </div>
        </section>
      </>
    );
  }

  const { items, payment, total } = orderData;

  return (
    <>
      <section className="order-success">
        <div className="success-banner">
          <p className="section-kicker">Order confirmed</p>
          <h2>🎉 Order Placed Successfully!</h2>
          <p className="success-copy">
            Your order is locked in and almost on its way. After we mark it delivered, you&apos;ll
            be able to rate each item from your <strong>Profile</strong> — that&apos;s when it
            counts, once you&apos;ve actually received everything.
          </p>
          <p className="success-pickup-hint">
            <strong>Pickup</strong> — we&apos;ll have everything ready within about{" "}
            <span className="success-pickup-time">15–25 minutes</span> during regular hours.
          </p>

          <div className="success-meta">
            <div className="success-meta-card">
              <span>Payment Method</span>
              <strong>{payment}</strong>
            </div>
            <div className="success-meta-card">
              <span>Total Paid</span>
              <strong>${total.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        <div className="section-heading success-items-heading">
          <p className="section-kicker">Your Items</p>
          <h3>Order summary</h3>
          <p className="section-subtext success-review-hint">
            Here&apos;s what we&apos;re preparing for you. Sign in anytime and open Profile after
            delivery to leave stars and a short note per item.
          </p>
        </div>

        <div className="order-items order-items--success order-items--summary">
          {items.map((item, index) => (
            <div key={item.id ?? `line-${index}`} className="order-card order-card--summary">
              <img src={item.image} alt={item.name} />
              <h3>{item.name}</h3>
              <p>Quantity: {item.qty}</p>
              <p>Price: ${(item.price * item.qty).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="order-success__actions">
          <Link to="/profile" className="order-btn">
            Go to Profile (after delivery)
          </Link>
          <Link to="/" className="shop-btn order-success__home-link">
            ← Back to Home
          </Link>
        </div>
      </section>
    </>
  );
}

export default OrderSuccess;
