import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/cartContextObject";
import showAlert from "../utils/showAlert";

function CartFab() {
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="cart-fab-anchor">
      <button
        type="button"
        className="floating-cart"
        onClick={() => {
          if (cart.length === 0) {
            showAlert("Your cart is empty");
          } else {
            navigate("/cart");
          }
        }}
        aria-label="Open shopping cart"
      >
        🛒
        {cartCount > 0 && (
          <span key={cartCount} className="cart-count is-bouncing">
            {cartCount}
          </span>
        )}
      </button>
    </div>
  );
}

export default CartFab;
