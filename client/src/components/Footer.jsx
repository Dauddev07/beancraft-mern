import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { api } from "../utils/api";

function Footer() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (user?.role === "admin") return undefined;

    const ac = new AbortController();
    (async () => {
      try {
        const data = await api("/categories", { signal: ac.signal });
        setCategories(Array.isArray(data) ? data : []);
      } catch (e) {
        if (e?.name === "AbortError") return;
        setCategories([]);
      }
    })();

    return () => ac.abort();
  }, [user?.role]);

  const getCategoryRoute = (slug) => {
    const s = String(slug || "")
      .toLowerCase()
      .trim();
    if (s === "coffee") return "/coffees";
    if (s === "sweets") return "/sweets";
    if (s === "specials") return "/specials";
    if (!s) return "/";
    return `/menu/${encodeURIComponent(s)}`;
  };

  const categoryLinks =
    categories.length > 0
      ? categories
      : [
          { slug: "coffee", name: "Coffees" },
          { slug: "sweets", name: "Sweets" },
          { slug: "specials", name: "Specials" },
        ];

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
          <p className="footer-tagline">
            Small-batch coffee and comfort desserts with a smooth online ordering experience.
          </p>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">Hours</h2>
          <div className="footer-list">
            <p className="footer-line">Mon - Fri: 7:00am - 9:00pm</p>
            <p className="footer-line">Sat - Sun: 8:00am - 10:00pm</p>
          </div>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">Visit</h2>
          <div className="footer-list">
            <p className="footer-line">123 Coffee Street</p>
            <p className="footer-line">Lahore, Pakistan</p>
            <a className="footer-link" href="tel:+923276058089">
              +92 327 6058089
            </a>
          </div>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">Categories</h2>
          <div className="footer-list">
            {categoryLinks.map((cat) => (
              <Link
                key={cat.id || cat.slug}
                className="footer-link"
                to={getCategoryRoute(cat.slug)}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="footer-col">
          <h2 className="footer-heading">Quick links</h2>
          <div className="footer-list">
            <Link className="footer-link" to="/cart">
              Cart
            </Link>
            {user ? (
              <Link className="footer-link" to="/profile">
                Profile
              </Link>
            ) : (
              <Link className="footer-link" to="/login">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copy">Copyright © Daud.dev All Rights Reserved</p>
      </div>
    </footer>
  );
}

export default Footer;
