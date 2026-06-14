import { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "../api/axiosInstance";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("/auth/me");
      setUser(res.data);
    } catch {
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email, password) => {
    const res = await axios.post("/auth/login", { email, password });
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const hasPermission = (module, action) => {
    if (!user?.role?.permissions) return false;
    const perm = user.role.permissions.find((p) => p.module === module);
    return perm ? Boolean(perm[action]) : false;
  };

  const getDataAccess = (module) => {
    if (!user?.role?.permissions) return "own";
    const perm = user.role.permissions.find((p) => p.module === module);
    return perm?.dataAccess || "own";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasPermission, getDataAccess, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
