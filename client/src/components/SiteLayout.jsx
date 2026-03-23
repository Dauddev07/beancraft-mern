import { Outlet, Navigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartFab from "./CartFab";
import ScrollToTop from "./ScrollToTop";
import { useAuth } from "../hooks/useAuth";

function SiteLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminUser = user?.role === "admin";

  if (isAdminUser && !location.pathname.startsWith("/admin")) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="site-layout">
      <ScrollToTop />
      <Navbar />
      <main className="site-main">
        <Outlet />
      </main>
      {!isAdminUser ? <CartFab /> : null}
      <Footer />
    </div>
  );
}

export default SiteLayout;
