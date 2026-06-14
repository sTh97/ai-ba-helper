import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme, THEMES } from "../../context/ThemeContext";
import ChangePasswordModal from "../../components/ChangePasswordModal";

const THEME_SWATCHES = {
  dark: ["#0a0b0f", "#4f8ef7"],
  light: ["#f4f6fa", "#3b6fd4"],
  alien: ["#030612", "#39ff14"],
};

const AI_MODEL = "Mistral 7B";

const ROUTE_TITLES = {
  "/dashboard": "Dashboard",
  "/add-project": "Projects",
  "/add-user-story": "Add Story",
  "/user-stories": "User Stories",
  "/create-application": "Create Application",
  "/marketing-collateral": "Marketing Collateral",
  "/solution-architecture": "Solution Architecture",
  "/roles": "Roles",
  "/users": "Users",
};

const roleBadgeColor = (roleName = "") => {
  const r = roleName.toLowerCase();
  if (r.includes("admin")) return "var(--accent)";
  if (r.includes("analyst") || r.includes("ba")) return "var(--green)";
  if (r.includes("manager") || r.includes("lead")) return "var(--purple)";
  return "var(--text-secondary)";
};

const LogoMark = ({ size = 28 }) => (
  <div style={{
    width: size, height: size, borderRadius: 8,
    background: "var(--header-gradient)",
    display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 18 18" fill="none">
      {[0, 1].map((row) =>
        [0, 1, 2].map((col) => {
          const highlighted = row === 0 && col === 2;
          return (
            <rect
              key={`${row}-${col}`}
              x={col * 6 + 1} y={row * 8 + 1}
              width={4} height={6} rx={1}
              fill={highlighted ? "#fff" : "rgba(255,255,255,0.45)"}
            />
          );
        })
      )}
    </svg>
  </div>
);

const MainLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [collapsed, setCollapsed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1400);
  const headerRef = useRef(null);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1200;
  const sidebarCollapsed = collapsed || isTablet;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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

  const navGroups = [
    {
      label: "Workspace",
      items: [
        { to: "/dashboard", icon: DashIcon, label: "Dashboard", module: "dashboard" },
        { to: "/add-project", icon: ProjectIcon, label: "Projects", module: "projects" },
      ],
    },
    {
      label: "Content",
      items: [
        { to: "/add-user-story", icon: EditIcon, label: "Add Story", module: "stories", action: "create" },
        { to: "/user-stories", icon: ListIcon, label: "User Stories", module: "stories" },
        { to: "/create-application", icon: AppIcon, label: "Create Application", module: "applications" },
      ],
    },
    {
      label: "Strategy",
      items: [
        { to: "/marketing-collateral", icon: MegaphoneIcon, label: "Marketing Collateral", module: "marketing" },
        { to: "/solution-architecture", icon: ArchitectureIcon, label: "Solution Architecture", module: "solution" },
      ],
    },
    {
      label: "Admin",
      items: [
        { to: "/roles", icon: ShieldIcon, label: "Roles", module: "roles" },
        { to: "/users", icon: UsersIcon, label: "Users", module: "users" },
      ],
    },
  ]
    .map((g) => ({ ...g, items: g.items.filter((item) => hasPermission(item.module, item.action || "read")) }))
    .filter((g) => g.items.length > 0);

  const mobileNavItems = navGroups
    .flatMap((g) => g.items)
    .filter((i) => ["/dashboard", "/user-stories", "/add-user-story", "/add-project"].includes(i.to))
    .slice(0, 4);

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
    : "U";

  const breadcrumb = ROUTE_TITLES[location.pathname] || "";

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
        <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
              BA&nbsp;Helper
            </span>
          </div>
          {breadcrumb && !isMobile && (
            <>
              <span style={{ color: "var(--border-bright)", fontSize: 13 }}>/</span>
              <span style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {breadcrumb}
              </span>
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
          {!isMobile && (
            <div className="ba-mono" style={{
              padding: "4px 12px", borderRadius: 99,
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              fontSize: 12, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums",
            }}>
              {currentTime.toLocaleTimeString()}
            </div>
          )}

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
              <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  {user?.firstName} {user?.lastName}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{user?.email}</div>
                {user?.role?.name && (
                  <span style={{
                    display: "inline-block", marginTop: 8, fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.5px", textTransform: "uppercase", padding: "3px 8px",
                    borderRadius: 99, color: roleBadgeColor(user.role.name),
                    background: `color-mix(in srgb, ${roleBadgeColor(user.role.name)} 14%, transparent)`,
                  }}>
                    {user.role.name}
                  </span>
                )}
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
        {!isMobile && (
          <aside style={{
            width: sidebarCollapsed ? 52 : 220,
            background: "var(--bg-surface)",
            borderRight: "1px solid var(--border)",
            padding: "14px 0 0",
            display: "flex", flexDirection: "column",
            transition: "width 0.22s cubic-bezier(.4,0,.2,1)",
            overflow: "hidden",
            flexShrink: 0,
            position: "sticky", top: 56, height: "calc(100vh - 56px)",
          }}>
            {!isTablet && (
              <button
                onClick={() => setCollapsed((c) => !c)}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                style={{
                  display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-end",
                  padding: "0 14px", marginBottom: 8, background: "none", border: "none",
                  color: "var(--text-muted)", cursor: "pointer",
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  {collapsed ? <path d="M9 18l6-6-6-6"/> : <path d="M15 18l-6-6 6-6"/>}
                </svg>
              </button>
            )}

            <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "0 8px", flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {navGroups.map((group, gi) => (
                <div key={group.label} style={{ marginTop: gi === 0 ? 0 : 14 }}>
                  {!sidebarCollapsed ? (
                    <div style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: "0.8px",
                      textTransform: "uppercase", color: "var(--text-muted)",
                      padding: "0 10px 6px",
                    }}>
                      {group.label}
                    </div>
                  ) : gi > 0 && (
                    <div style={{ height: 1, background: "var(--border)", margin: "0 10px 8px" }} />
                  )}
                  {group.items.map(({ to, icon: Icon, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      title={sidebarCollapsed ? label : undefined}
                      style={({ isActive }) => ({
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "8px 10px", marginBottom: 1, borderRadius: "var(--radius)",
                        textDecoration: "none", fontWeight: isActive ? 600 : 500, fontSize: 13,
                        color: isActive ? "var(--accent)" : "var(--text-secondary)",
                        background: "transparent",
                        borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
                        transition: "background 0.12s, color 0.12s",
                        whiteSpace: "nowrap", overflow: "hidden",
                      })}
                      onMouseEnter={(e) => {
                        if (e.currentTarget.getAttribute("aria-current") !== "page") e.currentTarget.style.background = "var(--bg-elevated)";
                      }}
                      onMouseLeave={(e) => {
                        if (e.currentTarget.getAttribute("aria-current") !== "page") e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span style={{ flexShrink: 0, opacity: 0.85, display: "flex" }}><Icon /></span>
                      {!sidebarCollapsed && <span>{label}</span>}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>

            <div style={{
              borderTop: "1px solid var(--border)", padding: sidebarCollapsed ? "12px 0" : "12px 16px",
              display: "flex", alignItems: "center", gap: 8,
              justifyContent: sidebarCollapsed ? "center" : "flex-start",
            }} title={`AI model: ${AI_MODEL}`}>
              <span style={{
                width: 6, height: 6, borderRadius: 99, flexShrink: 0,
                background: "var(--green)", boxShadow: "0 0 6px var(--green)",
              }} />
              {!sidebarCollapsed && (
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    Model
                  </div>
                  <div className="ba-mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {AI_MODEL}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}

        <main style={{
          flex: 1, overflowY: "auto", background: "var(--bg-base)",
          padding: isMobile ? "20px 16px 84px" : "28px 32px", minWidth: 0,
        }}>
          <Outlet />
        </main>
      </div>

      {isMobile && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 60,
          height: 64, background: "var(--bg-surface)", borderTop: "1px solid var(--border)",
          display: "flex", alignItems: "stretch",
        }}>
          {mobileNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 4, textDecoration: "none",
                fontSize: 10, fontWeight: 600,
                color: isActive ? "var(--accent)" : "var(--text-muted)",
              })}
            >
              <Icon />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
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
