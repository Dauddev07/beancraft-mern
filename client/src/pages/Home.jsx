import { Link, useLocation, useNavigate } from "react-router-dom";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePeriodicRefetch } from "../hooks/usePeriodicRefetch";
import { api } from "../utils/api";

function formatReviewDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  if (diffM < 1) return "Just now";
  if (diffM < 60) return `${diffM}m ago`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 14) return `${diffD}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function reviewerInitials(name) {
  const n = (name || "Guest").trim();
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0] || "?").slice(0, 2).toUpperCase();
}

function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const [bestProducts, setBestProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const loadGen = useRef(0);
  const [refetchTick, setRefetchTick] = useState(0);
  const pendingSectionIntentRef = useRef(null);

  const scrollMotion = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

  const scrollToSectionWithOffset = (id, behavior = scrollMotion()) => {
    const section = document.getElementById(id);
    if (!section) return false;

    const headerOffset =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--site-header-offset")) ||
      0;
    const top = section.getBoundingClientRect().top + window.scrollY - headerOffset - 8;

    window.scrollTo({
      top: Math.max(0, top),
      behavior,
    });
    return true;
  };

  /**
   * From a long page (e.g. profile at bottom) SPA scroll position persists.
   * ScrollToTop skips `/` when scrollToId is set, so we must reset the window
   * before section scrolling or the target section may not come into view reliably.
   */
  useLayoutEffect(() => {
    const id = location.state?.scrollToId;
    if (!id || typeof id !== "string") {
      pendingSectionIntentRef.current = null;
      return undefined;
    }

    pendingSectionIntentRef.current = id;
    window.scrollTo(0, 0);

    const rafId = requestAnimationFrame(() => {
      scrollToSectionWithOffset(id, scrollMotion());
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [location.key, location.state?.scrollToId]);

  useEffect(() => {
    const id = location.state?.scrollToId;
    if (!id || typeof id !== "string") {
      return undefined;
    }

    // After async cards load, do one quiet realignment for exact target placement.
    const t1 = window.setTimeout(() => {
      if (pendingSectionIntentRef.current === id) {
        scrollToSectionWithOffset(id, "auto");
      }
    }, 140);
    const t2 = window.setTimeout(() => {
      if (pendingSectionIntentRef.current === id) {
        scrollToSectionWithOffset(id, "auto");
      }
    }, 420);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [
    location.key,
    location.state?.scrollToId,
    bestProducts.length,
    reviews.length,
    categories.length,
  ]);

  useEffect(() => {
    const id = location.state?.scrollToId;
    if (!id || typeof id !== "string") {
      return undefined;
    }

    const clearState = window.setTimeout(() => {
      pendingSectionIntentRef.current = null;
      navigate(location.pathname, { replace: true, state: {} });
    }, 1200);

    return () => window.clearTimeout(clearState);
  }, [location.key, location.pathname, navigate, location.state?.scrollToId]);

  usePeriodicRefetch(setRefetchTick);

  useEffect(() => {
    const ac = new AbortController();
    const gen = ++loadGen.current;

    (async () => {
      try {
        const [best, recent, cats] = await Promise.all([
          api("/products/best-sellers", { signal: ac.signal }),
          api("/reviews/recent?limit=6", { signal: ac.signal }),
          api("/categories", { signal: ac.signal }),
        ]);
        if (gen !== loadGen.current) return;
        setBestProducts(Array.isArray(best) ? best : []);
        setReviews(Array.isArray(recent) ? recent : []);
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (e) {
        if (e?.name === "AbortError") return;
        if (gen !== loadGen.current) return;
        setBestProducts([]);
        setReviews([]);
        setCategories([]);
      }
    })();

    return () => ac.abort();
  }, [refetchTick]);

  const getRoute = (category) => {
    const slug =
      typeof category === "object" && category?.slug ? category.slug : category;
    const s = String(slug || "")
      .toLowerCase()
      .trim();
    if (s === "coffee") return "/coffees";
    if (s === "sweets") return "/sweets";
    if (s === "specials") return "/specials";
    if (!s) return "/";
    return `/menu/${encodeURIComponent(s)}`;
  };

  const starRow = (n) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

  const defaultCategories = [
    {
      slug: "coffee",
      name: "Coffees",
      image: "/images/Coffee image.jpg",
      desc: "Espresso, latte, cappuccino, and slow-sip cafe classics.",
    },
    {
      slug: "sweets",
      name: "Sweets",
      image: "/images/Sweets image.jpg",
      desc: "Comfort desserts with warm textures and rich cocoa notes.",
    },
    {
      slug: "specials",
      name: "Specials",
      image: "/images/special image.jpg",
      desc: "Seasonal favorites and standout picks worth trying first.",
    },
  ];

  const categoryCards =
    categories.length > 0
      ? categories.map((c) => {
          const slugKey = String(c.slug || "").toLowerCase();
          const fromApi = (c.description || "").trim();
          const fallback =
            defaultCategories.find((d) => d.slug === slugKey)?.desc || "Explore this category.";
          return {
            key: c.id || c.slug,
            slug: c.slug,
            name: c.name,
            image: c.image || "/images/Coffee image.jpg",
            desc: fromApi || fallback,
          };
        })
      : defaultCategories.map((c) => ({ ...c, key: c.slug }));

  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <p className="hero-kicker">Signature brews. Slow mornings. Better coffee.</p>
          <h1>Fresh Coffee Everyday</h1>
          <p>
            BeanCraft brings bold espresso, buttery pastries, and a warm cafe
            mood into one polished ordering experience.
          </p>

          <div className="hero-actions">
            <a href="#categories" className="shop-btn">
              Order Now
            </a>
            <a href="#about" className="hero-link">
              Explore Story
            </a>
          </div>

          <div className="hero-highlights">
            <div className="hero-stat">
              <strong>20+</strong>
              <span>Handcrafted menu picks</span>
            </div>
            <div className="hero-stat">
              <strong>4.9</strong>
              <span>Favorite local coffee mood</span>
            </div>
            <div className="hero-stat">
              <strong>Fast</strong>
              <span>Order flow built for mobile</span>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="about-content">
          <p className="section-kicker">About BeanCraft</p>
          <h2>About BeanCraft</h2>
          <p>
            BeanCraft is a modern coffee shop serving handcrafted coffee and
            desserts.
          </p>
          <div className="about-points">
            <div className="about-point">
              <strong>Small-batch taste</strong>
              <span>Balanced drinks with rich, cafe-style contrast.</span>
            </div>
            <div className="about-point">
              <strong>Sweet pairings</strong>
              <span>Pastries and desserts made to complement every cup.</span>
            </div>
            <div className="about-point">
              <strong>Smooth ordering</strong>
              <span>Browse, add, checkout, and rate with less friction.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="featured-section page-shell">
        <div className="featured-panel">
          <div className="featured-copy">
            <p className="section-kicker">Today&apos;s spotlight</p>
            <h2>Mocha mornings with pastry pairings that actually feel indulgent.</h2>
            <p className="section-subtext featured-subtext">
              Start with a rich house pour, match it with something buttery,
              and let the rest of the day slow down a little.
            </p>
            <Link to="/specials" className="shop-btn">
              See Featured Picks
            </Link>
          </div>
          <div className="featured-notes">
            <div className="featured-note">
              <strong>Signature roast</strong>
              <span>Full-bodied flavor with smooth finish and cafe warmth.</span>
            </div>
            <div className="featured-note">
              <strong>Best pairing</strong>
              <span>Chocolate, croissant, and soft pastry notes work beautifully.</span>
            </div>
          </div>
        </div>
      </section>

      {bestProducts.length > 0 && (
        <section className="best-sellers">
          <div className="section-heading">
            <p className="section-kicker">Customer favorites</p>
            <h2>Best Sellers</h2>
          </div>

          <div className="menu-container menu-container--catalog">
            {bestProducts.map((item) => (
              <Link to={getRoute(item.category)} key={item.id} className="menu-item">
                <div className="card-media">
                  <img src={item.image} alt={item.name} />
                  <span className="badge">🔥 Popular</span>
                </div>

                <div className="card-copy">
                  <h3>{item.name}</h3>
                  <p className="price-tag">${Number(item.price).toFixed(2)}</p>
                  <p className="rating">
                    {item.averageRating > 0 ? (
                      <>
                        ⭐ {item.averageRating.toFixed(1)} ({item.reviewCount}{" "}
                        {item.reviewCount === 1 ? "review" : "reviews"})
                      </>
                    ) : (
                      "No ratings yet"
                    )}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section id="categories" className="categories-section">
        <div className="section-heading">
          <p className="section-kicker">Choose your mood</p>
          <h2>Categories</h2>
        </div>

        <div className="categories-container">
          {categoryCards.map((c) => (
            <Link key={c.key} to={getRoute(c.slug)} className="category-card">
              <img src={c.image} alt={c.name} />
              <div className="category-copy">
                <h3>{c.name}</h3>
                <p>{c.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="reviews" className="testimonials recent-reviews-section page-shell">
        <div className="section-heading">
          <p className="section-kicker">Verified picks</p>
          <h2>Recently rated by customers</h2>
          <p className="section-subtext recent-reviews-lead">
            Real star ratings from people who checked out—same data you see on each menu card.
          </p>
        </div>

        <div className="testimonials-grid recent-reviews-grid">
          {reviews.length === 0 ? (
            <p className="testimonials-empty">
              After your order is delivered, rate items from your profile—reviews show up here for
              everyone.
            </p>
          ) : (
            reviews.map((r) => (
              <article key={r.id} className="testimonial-card recent-review-card">
                <header className="recent-review-head">
                  <span className="recent-review-avatar" aria-hidden="true">
                    {reviewerInitials(r.user?.name)}
                  </span>
                  <div className="recent-review-meta">
                    <span className="recent-review-name">{r.user?.name || "Customer"}</span>
                    <time className="recent-review-time" dateTime={r.createdAt || undefined}>
                      {formatReviewDate(r.createdAt)}
                    </time>
                  </div>
                  <span className="recent-review-badge">Verified order</span>
                </header>
                <div className="recent-review-rating-row" aria-label={`${r.rating} out of 5 stars`}>
                  <span className="recent-review-stars">{starRow(r.rating)}</span>
                  <span className="recent-review-score">{Number(r.rating).toFixed(1)} / 5</span>
                </div>
                <blockquote className="recent-review-quote">
                  {r.comment?.trim() ? (
                    <>“{r.comment.trim()}”</>
                  ) : (
                    <>
                      Quick rating for <strong>{r.product?.name || "a menu item"}</strong> — no
                      written review yet.
                    </>
                  )}
                </blockquote>
                {r.product?.name && (
                  <p className="recent-review-product">
                    <span className="recent-review-product-label">Ordered</span>
                    {r.product.name}
                  </p>
                )}
              </article>
            ))
          )}
        </div>
      </section>

      <section id="contact" className="contact">
        <div className="section-heading">
          <p className="section-kicker">Visit BeanCraft</p>
          <h2>Contact Us</h2>
        </div>

        <div className="contact-container">
          <div className="contact-card">
            <h3>📍Lahore, Pakistan</h3>
            <p>123 Coffee Street</p>
            <span>Open daily for espresso runs and dessert stops.</span>
          </div>

          <div className="contact-card">
            <h3>📞 Phone</h3>
            <p>+92 327 6058089</p>
            <span>Reach out for quick orders, questions, or support.</span>
          </div>

          <div className="contact-card">
            <h3>✉ Email</h3>
            <p>Dauddev@gmail.com</p>
            <span>We usually reply fast and keep things simple.</span>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
