import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme, THEMES } from "../../context/ThemeContext";
import ChangePasswordModal from "../../components/ChangePasswordModal";

const THEME_SWATCHES = {
  dark: ["#0a0b0f", "#4f8ef7"],
  light: ["#f4f6fa", "#3b6fd4"],
  alien: ["#030612", "#39ff14"],
};

const MainLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [collapsed, setCollapsed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowThemeMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { to: "/dashboard", icon: DashIcon, label: "Dashboard", module: "dashboard" },
    { to: "/add-project", icon: ProjectIcon, label: "Projects", module: "projects" },
    { to: "/add-user-story", icon: EditIcon, label: "Add Story", module: "stories", action: "create" },
    { to: "/user-stories", icon: ListIcon, label: "User Stories", module: "stories" },
    { to: "/create-application", icon: AppIcon, label: "Create Application", module: "applications" },
    { to: "/marketing-collateral", icon: MegaphoneIcon, label: "Marketing Collateral", module: "marketing" },
    { to: "/solution-architecture", icon: ArchitectureIcon, label: "Solution Architecture", module: "solution" },
    { to: "/roles", icon: ShieldIcon, label: "Roles", module: "roles" },
    { to: "/users", icon: UsersIcon, label: "Users", module: "users" },
  ].filter((item) => hasPermission(item.module, item.action || "read"));

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
    : "U";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg-base)" }}>
      <header className="app-header" ref={headerRef} style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: "56px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "var(--header-gradient)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.2px" }}>
            BA Helper
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
          <div style={{
            padding: "4px 12px", borderRadius: 99,
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            fontSize: 12, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums",
          }}>
            {currentTime.toLocaleTimeString()}
          </div>

          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setShowThemeMenu((s) => !s); setShowMenu(false); }}
              title="Change theme"
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: "1px solid var(--border)", cursor: "pointer",
                background: "var(--bg-elevated)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "var(--text-secondary)", fontSize: 15,
              }}
            >
              {THEMES[theme]?.icon || "🌙"}
            </button>
            {showThemeMenu && (
              <div style={{
                position: "absolute", top: 40, right: 0, minWidth: 180,
                background: "var(--bg-surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: "6px 0",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 100,
              }}>
                <div style={{ padding: "6px 14px 8px", fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Theme
                </div>
                {Object.entries(THEMES).map(([key, { label, icon }]) => (
                  <button
                    key={key}
                    onClick={() => { setTheme(key); setShowThemeMenu(false); }}
                    style={{
                      width: "100%", padding: "8px 14px", background: theme === key ? "var(--accent-soft)" : "none",
                      border: "none", cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 10,
                      color: theme === key ? "var(--accent)" : "var(--text-primary)", fontSize: 13,
                    }}
                  >
                    <span style={{ display: "flex", gap: 2 }}>
                      {THEME_SWATCHES[key].map((c) => (
                        <span key={c} style={{ width: 10, height: 10, borderRadius: 99, background: c, border: "1px solid var(--border)" }} />
                      ))}
                    </span>
                    <span>{icon} {label}</span>
                    {theme === key && <span style={{ marginLeft: "auto", fontSize: 11 }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => { setShowMenu((s) => !s); setShowThemeMenu(false); }}
            style={{
              width: 30, height: 30, borderRadius: 99, border: "none", cursor: "pointer",
              background: "var(--header-gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, color: "white",
            }}
          >
            {initials}
          </button>
          {showMenu && (
            <div style={{
              position: "absolute", top: 40, right: 0, minWidth: 200,
              background: "var(--bg-surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "8px 0",
              boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 100,
            }}>
              <div style={{ padding: "8px 16px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{user?.email}</div>
                <div style={{ fontSize: 11, color: "var(--accent)", marginTop: 4 }}>{user?.role?.name}</div>
              </div>
              <button
                onClick={() => { setShowPasswordModal(true); setShowMenu(false); }}
                style={{
                  width: "100%", padding: "10px 16px", background: "none", border: "none",
                  textAlign: "left", fontSize: 13, color: "var(--text-primary)", cursor: "pointer",
                }}
              >
                Change Password
              </button>
              <button
                onClick={handleLogout}
                style={{
                  width: "100%", padding: "10px 16px", background: "none", border: "none",
                  textAlign: "left", fontSize: 13, color: "var(--red)", cursor: "pointer",
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      <div style={{ display: "flex", flex: 1 }}>
        <aside style={{
          width: collapsed ? 56 : 216,
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          padding: "16px 0",
          display: "flex", flexDirection: "column",
          transition: "width 0.22s cubic-bezier(.4,0,.2,1)",
          overflow: "hidden",
          flexShrink: 0,
        }}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            style={{
              display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-end",
              padding: "0 14px", marginBottom: 12, background: "none", border: "none",
              color: "var(--text-muted)", cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
            </svg>
          </button>

          <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px" }}>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 10px", borderRadius: "var(--radius)",
                  textDecoration: "none", fontWeight: 500, fontSize: 13,
                  color: isActive ? "var(--accent)" : "var(--text-secondary)",
                  background: isActive ? "var(--accent-soft)" : "transparent",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap", overflow: "hidden",
                })}
              >
                <span style={{ flexShrink: 0, opacity: 0.85 }}><Icon /></span>
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main style={{ flex: 1, overflowY: "auto", background: "var(--bg-base)", padding: "28px 32px", minWidth: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const DashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);
const ProjectIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const ListIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const AppIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const MegaphoneIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
  </svg>
);
const ArchitectureIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
  </svg>
);
const ShieldIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const UsersIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

export default MainLayout;
