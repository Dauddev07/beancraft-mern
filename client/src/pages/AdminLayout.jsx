import { NavLink, Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <>
      <div className="admin-subnav-wrap page-shell">
        <nav className="admin-subnav" aria-label="Admin sections">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) => `admin-subnav-link${isActive ? " is-active" : ""}`}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/admin/orders"
            className={({ isActive }) => `admin-subnav-link${isActive ? " is-active" : ""}`}
          >
            Orders
          </NavLink>
        </nav>
      </div>
      <Outlet />
    </>
  );
}
