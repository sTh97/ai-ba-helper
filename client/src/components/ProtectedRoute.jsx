import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROUTE_PRIORITY = [
  { path: "/dashboard", module: "dashboard" },
  { path: "/add-project", module: "projects" },
  { path: "/add-user-story", module: "stories" },
  { path: "/create-application", module: "applications" },
  { path: "/roles", module: "roles" },
  { path: "/users", module: "users" },
];

const getFirstAllowedPath = (hasPermission) => {
  const match = ROUTE_PRIORITY.find((r) => hasPermission(r.module, "read"));
  return match?.path || "/login";
};

const ProtectedRoute = ({ module, action = "read" }) => {
  const { user, loading, hasPermission } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--bg-base)", color: "var(--text-muted)", fontSize: 14,
      }}>
        Loading…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (module && !hasPermission(module, action)) {
    return <Navigate to={getFirstAllowedPath(hasPermission)} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
