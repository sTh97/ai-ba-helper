import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";

const ProjectsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const StoriesIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);
const TestsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 2v6l-5 9a2 2 0 0 0 1.8 3h12.4a2 2 0 0 0 1.8-3l-5-9V2"/><path d="M7 2h10"/>
  </svg>
);
const FolderIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const StatCard = ({ label, value, color, icon, delta }) => (
  <div style={{
    background: "var(--bg-surface)", border: "1px solid var(--border)",
    borderLeft: `3px solid ${color}`,
    borderRadius: "var(--radius-lg)", padding: "20px 22px",
    display: "flex", alignItems: "center", gap: 16,
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 10, flexShrink: 0, color,
      background: color + "18", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {icon}
    </div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
          {value ?? "—"}
        </span>
        {delta != null && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: "var(--green)",
            background: "var(--green-soft)", padding: "2px 6px", borderRadius: 99,
          }}>
            ↑ {delta}%
          </span>
        )}
      </div>
    </div>
  </div>
);

const RowArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7"/>
  </svg>
);

const DataTable = ({ title, icon, headers, rows, emptyMsg = "No data yet" }) => (
  <div style={{
    background: "var(--bg-surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", overflow: "hidden",
    display: "flex", flexDirection: "column",
  }}>
    <div style={{
      padding: "15px 20px", borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", gap: 8, color: "var(--text-secondary)",
    }}>
      <span style={{ display: "flex", color: "var(--text-muted)" }}>{icon}</span>
      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
        {title}
      </span>
    </div>
    {rows.length === 0 ? (
      <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
        {emptyMsg}
      </div>
    ) : (
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h} style={{
                padding: "10px 16px", textAlign: "left",
                fontSize: 11, color: "var(--text-muted)",
                textTransform: "uppercase", letterSpacing: "0.7px",
                fontWeight: 500, borderBottom: "1px solid var(--border)",
                background: "var(--bg-elevated)",
              }}>{h}</th>
            ))}
            <th style={{ width: 28, borderBottom: "1px solid var(--border)", background: "var(--bg-elevated)" }} />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const zebra = i % 2 === 1 ? "color-mix(in srgb, var(--bg-elevated) 40%, transparent)" : "transparent";
            return (
              <tr
                key={i}
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: zebra,
                  cursor: "pointer", transition: "background 0.12s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-soft)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = zebra)}
              >
                {row.map((cell, j) => (
                  <td key={j} className={j === 0 ? undefined : "ba-mono"} style={{
                    padding: "11px 16px", fontSize: 13, color: "var(--text-secondary)",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {j === row.length - 1
                      ? <span style={{
                          display: "inline-flex", alignItems: "center", justifyContent: "center",
                          minWidth: 28, height: 20, borderRadius: 99,
                          background: "var(--accent-soft)", color: "var(--accent)",
                          fontWeight: 600, fontSize: 12,
                        }}>{cell}</span>
                      : <span style={{ color: "var(--text-primary)" }}>{cell}</span>
                    }
                  </td>
                ))}
                <td style={{ padding: "11px 12px", width: 28, color: "var(--text-muted)" }}>
                  <span className="ba-row-arrow" style={{ opacity: 0, transition: "opacity 0.12s", display: "flex" }}>
                    <RowArrow />
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
    <div style={{
      marginTop: "auto", padding: "8px 16px", borderTop: "1px solid var(--border)",
      textAlign: "right", fontSize: 11, color: "var(--text-muted)",
    }}>
      Last updated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/dashboard/stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Error fetching dashboard stats:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <Spinner />
    </div>
  );

  if (!stats) return (
    <div style={{ textAlign: "center", padding: 48, color: "var(--text-muted)" }}>
      Failed to load dashboard.
    </div>
  );

  const storiesByProject = Object.entries(stats.storiesByProject || {});
  const testsByStory = Object.entries(stats.testCasesByStory || {});
  const testsByProject = Object.entries(stats.testCasesByProject || {});
  const isEmpty = !stats.totalProjects && !stats.totalStories && !stats.totalTestCases;

  return (
    <div className="ba-page" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <PageHeader
        title="Dashboard"
        subtitle={`${greeting()}${user?.firstName ? `, ${user.firstName}` : ""} — here's your workspace at a glance.`}
      />

      {isEmpty ? (
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
        }}>
          <EmptyState
            icon={<FolderIcon />}
            message="Your workspace is empty"
            hint="Create your first project to start generating user stories and specifications."
            actionLabel="Create your first project →"
            onAction={() => navigate("/add-project")}
          />
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
            <StatCard label="Projects" value={stats.totalProjects} color="var(--accent)" icon={<ProjectsIcon />} delta={12} />
            <StatCard label="User Stories" value={stats.totalStories} color="var(--green)" icon={<StoriesIcon />} delta={8} />
            <StatCard label="Test Cases" value={stats.totalTestCases} color="var(--yellow)" icon={<TestsIcon />} delta={5} />
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            <DataTable
              title="User Stories by Project"
              icon={<ProjectsIcon />}
              headers={["Project", "Stories"]}
              rows={storiesByProject.map(([k, v]) => [k || "Unassigned", v])}
            />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
              <DataTable
                title="Test Cases by User Story"
                icon={<StoriesIcon />}
                headers={["Story ID", "Tests"]}
                rows={testsByStory.map(([k, v]) => [k, v])}
              />
              <DataTable
                title="Test Cases by Project"
                icon={<TestsIcon />}
                headers={["Project", "Tests"]}
                rows={testsByProject.map(([k, v]) => [k || "Unassigned", v])}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Spinner = () => (
  <div style={{
    width: 28, height: 28, borderRadius: "50%",
    border: "2px solid var(--border)", borderTopColor: "var(--accent)",
    animation: "spin 0.7s linear infinite",
  }} />
);

export default Dashboard;
