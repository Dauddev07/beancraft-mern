import showAlert from "../utils/showAlert";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { api } from "../utils/api";
import { useAuth } from "../hooks/useAuth";

function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name");
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const data = await api("/auth/signup", {
        method: "POST",
        body: { name, email, password },
      });

      login(data.token, data.user);
      showAlert("Account created successfully!");

      e.target.reset();

      setTimeout(() => {
        navigate("/");
      }, 1200);
    } catch (err) {
      showAlert(err.message || "Signup failed");
    }
  };

  return (
    <>
      <section className="login-body">
        <div className="login-container">
          <Link to="/" className="close-login" aria-label="Close signup form">
            ❌
          </Link>

          <p className="section-kicker">Create your account</p>
          <h2>Create Account</h2>
          <p className="auth-subtext">
            Save your details, order in fewer taps, and keep your BeanCraft
            favorites close.
          </p>

          <form onSubmit={handleSignup}>
            <label className="field-group">
              <span>Full Name</span>
              <input type="text" name="name" placeholder="Enter your full name" required />
            </label>

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
                  placeholder="Create a password"
                  required
                  minLength={6}
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

            <button type="submit">Signup</button>
          </form>

          <p className="signup-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </section>
    </>
  );
}

export default Signup;
