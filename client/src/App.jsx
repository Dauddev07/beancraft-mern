import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";

import SiteLayout from "./components/SiteLayout";
import Home from "./pages/Home";
import Coffees from "./pages/Coffees";
import Sweets from "./pages/Sweets";
import Specials from "./pages/Specials";
import MenuBySlug from "./pages/MenuBySlug";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Admin from "./pages/Admin";
import AdminLayout from "./pages/AdminLayout";
import AdminOrders from "./pages/AdminOrders";
import Profile from "./pages/Profile";
import OrderSuccess from "./pages/OrderSuccess";
import NotFound from "./pages/NotFound";
import { useAuth } from "./hooks/useAuth";

function AppRoutes() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/coffees" element={<Coffees />} />
        <Route path="/sweets" element={<Sweets />} />
        <Route path="/specials" element={<Specials />} />
        <Route path="/menu/:slug" element={<MenuBySlug />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Admin />} />
            <Route path="orders" element={<AdminOrders />} />
          </Route>
        </Route>
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function AdminRoute() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname || "/admin" }} />
    );
  }
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

function AppShell() {
  const location = useLocation();
  return (
    <>
      <div id="alertBox" className="alert-box" />
      <div key={location.pathname} className="page-fade-root">
        <AppRoutes />
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-frame">
        <AppShell />
      </div>
    </BrowserRouter>
  );
}

export default App;
