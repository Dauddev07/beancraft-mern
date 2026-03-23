import { Link } from "react-router-dom";

function NotFound() {
  return (
    <>
      <section className="not-found page-shell">
        <div className="not-found-card">
          <p className="section-kicker">404</p>
          <h1>Page not found</h1>
          <p className="not-found-copy">
            That link isn&apos;t on the menu. Head back home and pick something warm.
          </p>
          <Link to="/" className="shop-btn not-found-btn">
            Back to BeanCraft
          </Link>
        </div>
      </section>
    </>
  );
}

export default NotFound;
