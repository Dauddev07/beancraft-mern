import { useContext, useState, useEffect } from "react";
import { CartContext } from "../context/cartContextObject";
import showAlert from "../utils/showAlert";
import { useNavigate } from "react-router-dom";
import { api, getToken } from "../utils/api";

function Cart() {
  const { cart, increaseQty, decreaseQty, removeFromCart, clearCart } =
    useContext(CartContext);

  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);

  useEffect(() => {
    if (cart.length === 0 && !isOrdering) {
      showAlert("Your cart is empty");
      navigate("/", { replace: true, state: { scrollToId: "categories" } });
    }
  }, [cart, isOrdering, navigate]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const gst = subtotal < 40 ? subtotal * 0.1 : 0;
  const total = subtotal + gst;

  const placeOrder = async () => {
    if (!paymentMethod) {
      showAlert("Please select a payment method");
      return;
    }

    if (cart.length === 0) {
      showAlert("Your cart is empty");
      return;
    }

    if (!getToken()) {
      showAlert("Please login to place an order");
      navigate("/login", { state: { from: "/cart" } });
      return;
    }

    const orderItems = [...cart];

    setIsOrdering(true);

    try {
      await api("/orders", {
        method: "POST",
        body: {
          items: orderItems.map((item) => ({
            productId: item.id,
            name: item.name,
            qty: item.qty,
            price: item.price,
            image: item.image,
          })),
          paymentMethod,
          total,
        },
      });

      navigate("/order-success", {
        state: {
          items: orderItems,
          payment: paymentMethod,
          total,
        },
      });

      clearCart();
    } catch (err) {
      showAlert(err.message || "Order failed");
      setIsOrdering(false);
    }
  };

  return (
    <>
      <section className="cart-page">
        <div className="section-heading">
          <p className="section-kicker">Checkout</p>
          <h2>Your Cart</h2>
          <p className="section-subtext">
            Review your picks, adjust quantities, and complete your order in a
            few smooth steps.
          </p>
        </div>

        <div id="cartItems">
          {cart.map((item) => (
            <div key={item.id} className="cart-item">
              <img src={item.image} alt={item.name} />

              <div className="cart-item-copy">
                <h3>{item.name}</h3>

                <p className="price-tag">${Number(item.price).toFixed(2)}</p>

                <div className="cart-qty">
                  <button type="button" onClick={() => decreaseQty(item.id)}>
                    -
                  </button>

                  <span>{item.qty}</span>

                  <button type="button" onClick={() => increaseQty(item.id)}>
                    +
                  </button>
                </div>

                <p className="cart-line-total">
                  Total: ${(item.price * item.qty).toFixed(2)}
                </p>

                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => {
                    removeFromCart(item.id);
                    showAlert(item.name + " removed from cart");
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div id="checkoutBox">
          <div className="checkout-head">
            <p className="section-kicker">Summary</p>
            <h3>Ready to place your order?</h3>
          </div>

          <div id="totalPrice">
            <p>Subtotal: ${subtotal.toFixed(2)}</p>
            <p>GST (10% if &lt; $40): ${gst.toFixed(2)}</p>
            <h3>Total: ${total.toFixed(2)}</h3>
          </div>

          <div className="payment-options">
            <h4>Select Payment Method</h4>

            <label>
              <input
                type="radio"
                name="payment"
                value="Online Payment"
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              Online Payment
            </label>

            <label>
              <input
                type="radio"
                name="payment"
                value="Cash on Delivery"
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              Cash on Delivery
            </label>
          </div>

          <button
            type="button"
            className="order-btn"
            onClick={placeOrder}
            disabled={isOrdering}
          >
            {isOrdering ? "Placing order…" : "Place Order"}
          </button>
        </div>
      </section>
    </>
  );
}

export default Cart;
