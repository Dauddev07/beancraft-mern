import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { CartContext } from "../context/cartContextObject";
import showAlert from "../utils/showAlert";
import { useAuth } from "../hooks/useAuth";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const { clearCart } = useContext(CartContext);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminUser = user?.role === "admin";

  const navActiveKey =
    location.pathname === "/"
      ? activeSection
      : location.pathname.replace("/", "") || "home";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 18);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (location.pathname !== "/" || isAdminUser) {
      return undefined;
    }

    const sectionIds = ["about", "categories", "contact"];
    const handleSectionScroll = () => {
      const currentSection =
        sectionIds.find((id) => {
          const element = document.getElementById(id);
          if (!element) {
            return false;
          }

          const { top, bottom } = element.getBoundingClientRect();
          return top <= 140 && bottom >= 140;
        }) || "home";

      setActiveSection(currentSection);
    };

    handleSectionScroll();
    window.addEventListener("scroll", handleSectionScroll);
    return () => window.removeEventListener("scroll", handleSectionScroll);
  }, [location.pathname, isAdminUser]);

  const handleLogout = () => {
    logout();
    clearCart();
    showAlert("You have been logged out");

    setTimeout(() => {
      navigate("/");
    }, 1200);
  };

  const scrollMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  const goToSection = (id) => {
    setMenuOpen(false);
    if (location.pathname === "/") {
      const behavior = scrollMotion();
      const run = () => {
        const section = document.getElementById(id);
        if (section) {
          section.scrollIntoView({ behavior, block: "start" });
        }
      };
      requestAnimationFrame(() => requestAnimationFrame(run));
      window.setTimeout(run, 100);
      window.setTimeout(run, 280);
      return;
    }
    navigate("/", { state: { scrollToId: id } });
  };

  const handleHomeClick = (e) => {
    setMenuOpen(false);
    if (location.pathname !== "/") {
      return;
    }
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: scrollMotion() });
    setActiveSection("home");
  };

  if (isAdminUser) {
    return (
      <header className="site-header">
        <nav className={`navbar navbar--admin ${isScrolled ? "is-scrolled" : ""}`}>
          <Link to="/admin" className="navbar-brand" onClick={() => setMenuOpen(false)}>
            <h1 className="logo">☕ BeanCraft</h1>
          </Link>

          <ul className={`nav-links nav-links--admin ${menuOpen ? "active" : ""}`}>
            <li>
              <NavLink
                to="/admin"
                end
                className={({ isActive }) => (isActive ? "is-active" : "")}
                onClick={() => setMenuOpen(false)}
              >
                ⚙️ Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin/orders"
                className={({ isActive }) => (isActive ? "is-active" : "")}
                onClick={() => setMenuOpen(false)}
              >
                📦 Orders
              </NavLink>
            </li>
            <li>
              <button type="button" className="nav-link-button" onClick={handleLogout}>
                🚪 Logout
              </button>
            </li>
          </ul>

          <button
            type="button"
            className="menu-btn"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            ☰
          </button>
        </nav>
      </header>
    );
  }

  return (
    <header className="site-header">
      <nav className={`navbar ${isScrolled ? "is-scrolled" : ""}`}>
        <Link to="/" className="navbar-brand" onClick={handleHomeClick}>
          <h1 className="logo">☕ BeanCraft</h1>
        </Link>

        <ul className={`nav-links ${menuOpen ? "active" : ""}`}>
          <li>
            <Link
              to="/"
              className={navActiveKey === "home" ? "is-active" : ""}
              onClick={handleHomeClick}
            >
              🏠 Home
            </Link>
          </li>

          <li>
            <button
              type="button"
              className={`nav-link-button ${navActiveKey === "about" ? "is-active" : ""}`}
              onClick={() => goToSection("about")}
            >
              ℹ️ About
            </button>
          </li>

          <li>
            <button
              type="button"
              className={`nav-link-button ${navActiveKey === "categories" ? "is-active" : ""}`}
              onClick={() => goToSection("categories")}
            >
              📋 Menu
            </button>
          </li>

          <li>
            <button
              type="button"
              className={`nav-link-button ${navActiveKey === "contact" ? "is-active" : ""}`}
              onClick={() => goToSection("contact")}
            >
              📞 Contact
            </button>
          </li>

          {user && (
            <li>
              <Link
                to="/profile"
                className={location.pathname === "/profile" ? "is-active" : ""}
                onClick={() => setMenuOpen(false)}
              >
                👤 Profile
              </Link>
            </li>
          )}

          <li>
            {user ? (
              <button type="button" className="nav-link-button" onClick={handleLogout}>
                🚪 Logout
              </button>
            ) : (
              <Link
                to="/login"
                className={navActiveKey === "login" ? "is-active" : ""}
                onClick={() => setMenuOpen(false)}
              >
                🔐 Login
              </Link>
            )}
          </li>
        </ul>

        <button
          type="button"
          className="menu-btn"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
        >
          ☰
        </button>
      </nav>
    </header>
  );
}

export default Navbar;
