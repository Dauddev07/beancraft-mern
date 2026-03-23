import showAlert from "../utils/showAlert";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { api } from "../utils/api";
import { useAuth } from "../hooks/useAuth";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });

      login(data.token, data.user);
      showAlert("Login successful!");

      e.target.reset();

      const from = location.state?.from;
      const redirectTo =
        data.user?.role === "admin"
          ? typeof from === "string" && from.startsWith("/admin")
            ? from
            : "/admin"
          : from || "/";
      setTimeout(() => {
        navigate(redirectTo);
      }, 800);
    } catch (err) {
      showAlert(err.message || "Login failed");
    }
  };

  return (
    <>
      <section className="login-body">
        <div className="login-container">
          <Link to="/" className="close-login" aria-label="Close login form">
            ❌
          </Link>

          <p className="section-kicker">Welcome back</p>
          <h2>Login</h2>
          <p className="auth-subtext">
            Sign in to continue your coffee run, manage your cart, and finish
            checkout faster.
          </p>

          <form onSubmit={handleLogin}>
            <label className="field-group">
              <span>Email</span>
              <input type="email" name="email" placeholder="Enter your email" required />
            </label>

            <label className="field-group">
              <span>Password</span>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button type="submit">Login</button>
          </form>

          <p className="signup-link">
            Don&apos;t have an account? <Link to="/signup">Signup</Link>
          </p>
        </div>
      </section>
    </>
  );
}

export default Login;
