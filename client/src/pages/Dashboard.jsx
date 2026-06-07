// import { useEffect, useState } from "react";
// import axios from "../api/axiosInstance";

// const Dashboard = () => {
//   const [stats, setStats] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchStats = async () => {
//       try {
//         const res = await axios.get("/dashboard/stats");
//         setStats(res.data);
//       } catch (err) {
//         console.error("Error fetching dashboard stats:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchStats();
//   }, []);

//   if (loading) return <p>Loading dashboard...</p>;
//   if (!stats) return <p>Failed to load dashboard.</p>;

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold mb-6 text-blue-700">📊 Dashboard Overview</h2>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
//         <div className="bg-white shadow rounded-lg p-4 border-l-4 border-blue-500">
//           <p className="text-gray-500">Projects</p>
//           <p className="text-2xl font-bold">{stats.totalProjects}</p>
//         </div>
//         <div className="bg-white shadow rounded-lg p-4 border-l-4 border-green-500">
//           <p className="text-gray-500">User Stories</p>
//           <p className="text-2xl font-bold">{stats.totalStories}</p>
//         </div>
//         <div className="bg-white shadow rounded-lg p-4 border-l-4 border-purple-500">
//           <p className="text-gray-500">Test Cases</p>
//           <p className="text-2xl font-bold">{stats.totalTestCases}</p>
//         </div>
//       </div>

//       {/* Table: User Stories by Project */}
//       <div className="mb-8">
//         <h3 className="text-xl font-semibold mb-2 text-gray-800">📁 User Stories by Project</h3>
//         <table className="w-full text-sm border">
//           <thead>
//             <tr className="bg-gray-200">
//               <th className="border px-3 py-2">Project</th>
//               <th className="border px-3 py-2"># of Stories</th>
//             </tr>
//           </thead>
//           <tbody>
//             {Object.entries(stats.storiesByProject || {}).map(([projectName, count], idx) => (
//               <tr key={idx}>
//                 <td className="border px-3 py-2">{projectName || "Unassigned"}</td>
//                 <td className="border px-3 py-2 text-center">{count}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Table: Test Cases by User Story */}
//       <div className="mb-8">
//         <h3 className="text-xl font-semibold mb-2 text-gray-800">🧪 Test Cases by User Story</h3>
//         <table className="w-full text-sm border">
//           <thead>
//             <tr className="bg-gray-200">
//               <th className="border px-3 py-2">User Story ID</th>
//               <th className="border px-3 py-2"># of Test Cases</th>
//             </tr>
//           </thead>
//           <tbody>
//             {Object.entries(stats.testCasesByStory || {}).map(([storyId, count], idx) => (
//               <tr key={idx}>
//                 <td className="border px-3 py-2">{storyId}</td>
//                 <td className="border px-3 py-2 text-center">{count}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       {/* Table: Test Cases by Project */}
//       <div className="mb-8">
//         <h3 className="text-xl font-semibold mb-2 text-gray-800">📦 Test Cases by Project</h3>
//         <table className="w-full text-sm border">
//           <thead>
//             <tr className="bg-gray-200">
//               <th className="border px-3 py-2">Project</th>
//               <th className="border px-3 py-2"># of Test Cases</th>
//             </tr>
//           </thead>
//           <tbody>
//             {Object.entries(stats.testCasesByProject || {}).map(([projectName, count], idx) => (
//               <tr key={idx}>
//                 <td className="border px-3 py-2">{projectName || "Unassigned"}</td>
//                 <td className="border px-3 py-2 text-center">{count}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;


import { useEffect, useState } from "react";
import axios from "../api/axiosInstance";

const StatCard = ({ label, value, color, icon }) => (
  <div style={{
    background: "var(--bg-surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", padding: "20px 22px",
    display: "flex", alignItems: "center", gap: 16, position: "relative", overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", top: 0, left: 0, right: 0, height: 2,
      background: color, opacity: 0.7,
    }} />
    <div style={{
      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
      background: color + "18", display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
    </div>
    <div>
      <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
        {value ?? "—"}
      </div>
    </div>
  </div>
);

const DataTable = ({ title, icon, headers, rows, emptyMsg = "No data" }) => (
  <div style={{
    background: "var(--bg-surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)", overflow: "hidden",
  }}>
    <div style={{
      padding: "16px 20px", borderBottom: "1px solid var(--border)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ fontSize: 15 }}>{icon}</span>
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
          <tr style={{ background: "var(--bg-elevated)" }}>
            {headers.map(h => (
              <th key={h} style={{
                padding: "10px 16px", textAlign: "left",
                fontSize: 11, color: "var(--text-muted)",
                textTransform: "uppercase", letterSpacing: "0.7px",
                fontWeight: 500, borderBottom: "1px solid var(--border)",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
              {row.map((cell, j) => (
                <td key={j} style={{
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
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/dashboard/stats")
      .then(res => setStats(res.data))
      .catch(err => console.error("Error fetching dashboard stats:", err))
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

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "var(--text-primary)", margin: 0 }}>
          Dashboard
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          Overview of your business analysis workspace
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
        <StatCard label="Projects" value={stats.totalProjects} color="var(--accent)" icon="🗂️" />
        <StatCard label="User Stories" value={stats.totalStories} color="var(--green)" icon="📝" />
        <StatCard label="Test Cases" value={stats.totalTestCases} color="var(--yellow)" icon="🧪" />
      </div>

      {/* Tables */}
      <div style={{ display: "grid", gap: 14 }}>
        <DataTable
          title="User Stories by Project"
          icon="📁"
          headers={["Project", "Stories"]}
          rows={Object.entries(stats.storiesByProject || {}).map(([k, v]) => [k || "Unassigned", v])}
        />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <DataTable
            title="Test Cases by User Story"
            icon="🔗"
            headers={["Story ID", "Tests"]}
            rows={Object.entries(stats.testCasesByStory || {}).map(([k, v]) => [k, v])}
          />
          <DataTable
            title="Test Cases by Project"
            icon="📦"
            headers={["Project", "Tests"]}
            rows={Object.entries(stats.testCasesByProject || {}).map(([k, v]) => [k || "Unassigned", v])}
          />
        </div>
      </div>
    </div>
  );
};

const Spinner = () => (
  <div style={{
    width: 28, height: 28, borderRadius: "50%",
    border: "2px solid var(--border)", borderTopColor: "var(--accent)",
    animation: "spin 0.7s linear infinite",
  }}>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default Dashboard;