// import { useEffect, useState } from "react";
// import { NavLink, Outlet } from "react-router-dom";

// const MainLayout = () => {
//   const [currentTime, setCurrentTime] = useState(new Date());

//   useEffect(() => {
//     const timer = setInterval(() => setCurrentTime(new Date()), 1000);
//     return () => clearInterval(timer);
//   }, []);

//   return (
//     <div className="min-h-screen flex flex-col">
//       {/* Header */}
//       <header className="bg-blue-800 text-white py-3 px-6 shadow-md">
//         <h1 className="text-xl font-bold">Business Analysis Tool</h1>
//       </header>

//       <div className="flex flex-1">
//         {/* Sidebar */}
//         <aside className="w-64 bg-gray-100 border-r p-4 space-y-4 text-gray-800">
//           <nav className="flex flex-col space-y-2 text-sm">
//             <NavLink to="/dashboard" className="hover:text-blue-600 font-medium">🏠 Dashboard</NavLink>
//             <NavLink to="/add-project" className="hover:text-blue-600 font-medium">🧩 Add Projects</NavLink>
//             <NavLink to="/add-user-story" className="hover:text-blue-600 font-medium">✍️ Add User Stories</NavLink>
//             <NavLink to="/user-stories" className="hover:text-blue-600 font-medium">📋 User Stories</NavLink>
//           </nav>
//         </aside>

//         {/* Main Content Area */}
//         <main className="flex-1 bg-white p-6">
//           <Outlet />
//         </main>
//       </div>

//       {/* Footer */}
//       <footer className="bg-gray-200 text-center py-2 text-sm text-gray-700">
//         Model by Taimoor @ 7/5/2025 | Today Time: {currentTime.toLocaleString()}
//       </footer>
//     </div>
//   );
// };

// export default MainLayout;


import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";

const MainLayout = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { to: "/dashboard", icon: DashIcon, label: "Dashboard" },
    { to: "/add-project", icon: ProjectIcon, label: "Projects" },
    { to: "/add-user-story", icon: EditIcon, label: "Add Story" },
    { to: "/user-stories", icon: ListIcon, label: "User Stories" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* Top Header Bar */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", height: "56px",
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "linear-gradient(135deg, #4f8ef7 0%, #6c63ff 100%)",
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

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            padding: "4px 12px", borderRadius: 99,
            background: "var(--bg-elevated)", border: "1px solid var(--border)",
            fontSize: 12, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums",
            letterSpacing: "0.2px",
          }}>
            {currentTime.toLocaleTimeString()}
          </div>
          <div style={{
            width: 30, height: 30, borderRadius: 99,
            background: "linear-gradient(135deg, #4f8ef7 0%, #6c63ff 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "white",
          }}>T</div>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
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
            onClick={() => setCollapsed(c => !c)}
            style={{
              display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "flex-end",
              padding: "0 14px", marginBottom: 12, background: "none", border: "none",
              color: "var(--text-muted)", cursor: "pointer",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {collapsed
                ? <><path d="M9 18l6-6-6-6"/></>
                : <><path d="M15 18l-6-6 6-6"/></>}
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

          <div style={{ marginTop: "auto", padding: "0 16px 8px" }}>
            {!collapsed && (
              <div style={{
                fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5,
                borderTop: "1px solid var(--border)", paddingTop: 12,
              }}>
                Built by Taimoor
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
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

export default MainLayout;