import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../services/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("logitrack_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem("logitrack_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.getMe();
        setUser(res.data.user);
        localStorage.setItem("logitrack_user", JSON.stringify(res.data.user));
      } catch {
        localStorage.removeItem("logitrack_token");
        localStorage.removeItem("logitrack_user");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    verifyToken();
  }, []);

  const login = useCallback(async (email, password, loginType) => {
    const res = await authApi.login({ email, password, loginType });
    const { token, user: userData } = res.data;
    localStorage.setItem("logitrack_token", token);
    localStorage.setItem("logitrack_user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("logitrack_token");
    localStorage.removeItem("logitrack_user");
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const isAdmin = hasRole("ADMIN");
  const isManager = hasRole("ADMIN", "WAREHOUSE_MANAGER", "LOGISTICS_MANAGER");

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, isAdmin, isManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;
