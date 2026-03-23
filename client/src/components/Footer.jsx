import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function Footer() {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return (
      <footer className="footer footer--admin-minimal">
        <div className="footer-bottom footer-bottom--admin">
          <p className="footer-copy">Copyright © Daud.dev All Rights Reserved</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <p className="footer-logo">BeanCraft</p>
          <p className="footer-tagline">Small-batch coffee &amp; comfort desserts — order online, sip slower.</p>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">Hours</h2>
          <p className="footer-line">Mon — Fri · 7am — 9pm</p>
          <p className="footer-line">Sat — Sun · 8am — 10pm</p>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">Visit</h2>
          <p className="footer-line">123 Coffee Street</p>
          <p className="footer-line">Lahore, Pakistan</p>
          <a className="footer-link" href="tel:+923276058089">
            +92 327 6058089
          </a>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">Explore</h2>
          <Link className="footer-link" to="/coffees">
            Coffees
          </Link>
          <Link className="footer-link" to="/sweets">
            Sweets
          </Link>
          <Link className="footer-link" to="/specials">
            Specials
          </Link>
          <Link className="footer-link" to="/cart">
            Cart
          </Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copy">Copyright © Daud.dev All Rights Reserved</p>
      </div>
    </footer>
  );
}

export default Footer;
