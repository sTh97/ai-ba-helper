import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Folder,
  Layers,
  LayoutGrid,
  List,
  Megaphone,
  Moon,
  PenLine,
  Shield,
  Sun,
  Users,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useLLM, getTierStyle } from "../../context/LLMContext";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import LogoMark from "../../components/LogoMark";

const TierBadge = ({ tier, tierLabel }) => {
  const style = getTierStyle(tier);
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.4px", textTransform: "uppercase",
      padding: "2px 6px", borderRadius: 99, flexShrink: 0,
      color: style.color,
      background: `color-mix(in srgb, ${style.color} 16%, transparent)`,
      border: `1px solid color-mix(in srgb, ${style.color} 30%, transparent)`,
    }}>
      {tierLabel || style.label}
    </span>
  );
};

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

const LogoMarkHeader = ({ size = 28 }) => <LogoMark size={size} />;

const NavIcon = ({ icon: Icon }) => (
  <Icon size={15} strokeWidth={1.75} className="shrink-0 opacity-85" />
);

const MainLayout = () => {
  const { user, logout, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { configuredModels, selectedModel, selectedId, setSelectedId, loading: llmLoading } = useLLM();
  const modelDisplayLabel = selectedModel?.label
    || (selectedId ? selectedId.replace(/^[^:]+:/, "").replace(/-/g, " ") : "Not configured");
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [collapsed, setCollapsed] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showLLMMenu, setShowLLMMenu] = useState(false);
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
        setShowLLMMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navGroups = [
    {
      label: "Workspace",
      items: [
        { to: "/dashboard", icon: LayoutGrid, label: "Dashboard", module: "dashboard" },
        { to: "/add-project", icon: Folder, label: "Projects", module: "projects" },
      ],
    },
    {
      label: "Content",
      items: [
        { to: "/add-user-story", icon: PenLine, label: "Add Story", module: "stories", action: "create" },
        { to: "/user-stories", icon: List, label: "User Stories", module: "stories" },
        { to: "/create-application", icon: LayoutGrid, label: "Create Application", module: "applications" },
      ],
    },
    {
      label: "Strategy",
      items: [
        { to: "/marketing-collateral", icon: Megaphone, label: "Marketing Collateral", module: "marketing" },
        { to: "/solution-architecture", icon: Layers, label: "Solution Architecture", module: "solution" },
      ],
    },
    {
      label: "Admin",
      items: [
        { to: "/roles", icon: Shield, label: "Roles", module: "roles" },
        { to: "/users", icon: Users, label: "Users", module: "users" },
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
            <LogoMarkHeader />
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 15, color: "var(--text-primary)", letterSpacing: "-0.3px" }}>
              Requify
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
          {isMobile && selectedModel && (
            <button
              type="button"
              onClick={() => { setShowLLMMenu((s) => !s); setShowMenu(false); }}
              style={{
                padding: "4px 8px", borderRadius: 99, maxWidth: 140,
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                fontSize: 10, color: "var(--text-secondary)", cursor: "pointer",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {selectedModel.label}
            </button>
          )}
          {!isMobile && (
            <div className="ba-mono" style={{
              padding: "4px 12px", borderRadius: 99,
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              fontSize: 12, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums",
            }}>
              {currentTime.toLocaleTimeString()}
            </div>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="w-8 h-8 rounded-lg border border-border cursor-pointer bg-elevated flex items-center justify-center text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {theme === "dark" ? <Moon size={18} strokeWidth={1.75} /> : <Sun size={18} strokeWidth={1.75} />}
          </button>

          <button
            onClick={() => setShowMenu((s) => !s)}
            className="w-[30px] h-[30px] rounded-full border-none cursor-pointer bg-accent flex items-center justify-center text-xs font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
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
          {showLLMMenu && isMobile && (
            <div style={{
              position: "fixed", inset: 0, zIndex: 200,
              background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end",
            }} onClick={() => setShowLLMMenu(false)}>
              <div style={{
                width: "100%", maxHeight: "70vh", overflowY: "auto",
                background: "var(--bg-surface)", borderTop: "1px solid var(--border)",
                borderRadius: "16px 16px 0 0", padding: "12px 0 24px",
              }} onClick={(e) => e.stopPropagation()}>
                <div style={{ padding: "8px 16px 12px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                  Choose AI Model
                </div>
                <div style={{ padding: "0 16px 10px", fontSize: 11, color: "var(--text-muted)" }}>
                  Providers configured in server/.env
                </div>
                {configuredModels.map((model) => {
                  const active = model.id === selectedId;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(model.id);
                        setShowLLMMenu(false);
                      }}
                      style={{
                        width: "100%", padding: "12px 16px", background: active ? "var(--accent-soft)" : "none",
                        border: "none", borderTop: "1px solid var(--border)",
                        cursor: "pointer", textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: active ? "var(--accent)" : "var(--text-primary)" }}>{model.label}</span>
                        <TierBadge tier={model.tier} tierLabel={model.tierLabel} />
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{model.tierDetail}</div>
                    </button>
                  );
                })}
              </div>
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
            overflow: "visible",
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
                <ChevronRight size={14} strokeWidth={2} className={collapsed ? "" : "hidden"} />
                <ChevronLeft size={14} strokeWidth={2} className={collapsed ? "hidden" : ""} />
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
                      <NavIcon icon={Icon} />
                      {!sidebarCollapsed && <span>{label}</span>}
                    </NavLink>
                  ))}
                </div>
              ))}
            </nav>

            <div style={{
              borderTop: "1px solid var(--border)",
              padding: sidebarCollapsed ? "12px 0" : "12px 10px",
              position: "relative",
              zIndex: 20,
              flexShrink: 0,
            }}>
              <button
                type="button"
                onClick={() => { if (!sidebarCollapsed) setShowLLMMenu((s) => !s); }}
                title={selectedModel ? `AI model: ${selectedModel.label}` : `AI model: ${modelDisplayLabel}`}
                style={{
                  width: "100%",
                  display: "flex", alignItems: "center", gap: 8,
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  padding: sidebarCollapsed ? "4px 0" : "8px 6px",
                  background: showLLMMenu ? "var(--bg-elevated)" : "none",
                  border: "none", borderRadius: "var(--radius)", cursor: sidebarCollapsed ? "default" : "pointer",
                  textAlign: "left",
                }}
              >
                <span style={{
                  width: 6, height: 6, borderRadius: 99, flexShrink: 0,
                  background: selectedModel?.tier === "paid" ? "var(--orange, #f97316)" : "var(--green)",
                  boxShadow: selectedModel?.tier === "paid"
                    ? "0 0 6px var(--orange, #f97316)"
                    : "0 0 6px var(--green)",
                }} />
                {!sidebarCollapsed && (
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: "var(--text-muted)" }}>
                        AI Model
                      </div>
                      {selectedModel && <TierBadge tier={selectedModel.tier} tierLabel={selectedModel.tierLabel} />}
                    </div>
                    <div className="ba-mono" style={{ fontSize: 11, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {llmLoading ? "Loading…" : modelDisplayLabel}
                    </div>
                  </div>
                )}
                {!sidebarCollapsed && (
                  <ChevronDown
                    size={12}
                    strokeWidth={2}
                    className="shrink-0 text-muted transition-transform duration-150"
                    style={{ transform: showLLMMenu ? "rotate(180deg)" : "none" }}
                  />
                )}
              </button>

              {showLLMMenu && !sidebarCollapsed && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                  position: "absolute", bottom: "100%", left: 8, right: 8, marginBottom: 6,
                  maxHeight: 320, overflowY: "auto",
                  background: "var(--bg-surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "6px 0",
                  boxShadow: "0 -8px 32px rgba(0,0,0,0.35)", zIndex: 100,
                }}>
                  <div style={{ padding: "6px 12px 8px", fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Choose AI Model
                  </div>
                  <div style={{ padding: "0 12px 8px", fontSize: 10, color: "var(--text-muted)", lineHeight: 1.4 }}>
                    Only providers with API keys in server/.env are listed. Free models cost nothing; paid models bill per use.
                  </div>
                  {configuredModels.length === 0 && (
                    <div style={{ padding: "8px 12px", fontSize: 11, color: "var(--red)" }}>
                      No AI providers configured. Add API keys to server/.env and restart the server.
                    </div>
                  )}
                  {configuredModels.map((model) => {
                    const active = model.id === selectedId;
                    return (
                      <button
                        key={model.id}
                        type="button"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setSelectedId(model.id);
                          setShowLLMMenu(false);
                        }}
                        style={{
                          width: "100%", padding: "10px 12px", background: active ? "var(--accent-soft)" : "none",
                          border: "none", cursor: "pointer", textAlign: "left",
                          borderTop: "1px solid var(--border)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: active ? "var(--accent)" : "var(--text-primary)", flex: 1 }}>
                            {model.label}
                          </span>
                          <TierBadge tier={model.tier} tierLabel={model.tierLabel} />
                          {active && <Check size={14} strokeWidth={1.75} className="text-accent" />}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.35, marginBottom: 2 }}>
                          {model.description}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-secondary)" }}>
                          {model.tierDetail}
                        </div>
                      </button>
                    );
                  })}
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
              <NavIcon icon={Icon} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
};

export default MainLayout;
