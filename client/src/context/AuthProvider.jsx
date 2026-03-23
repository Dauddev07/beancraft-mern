import { useMemo, useState } from "react";
import { setAuth as persistAuth } from "../utils/api";
import { AuthContext } from "./authContextObject";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("beancraft_user");
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  const login = (token, userObj) => {
    persistAuth(token, userObj);
    setUser(userObj);
  };

  const logout = () => {
    persistAuth(null, null);
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
