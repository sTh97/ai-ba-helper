import { useEffect, useState } from "react";
import axios from "../api/axiosInstance";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/dashboard/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (!stats) return <p>Failed to load dashboard.</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">📊 Dashboard Overview</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-blue-500">
          <p className="text-gray-500">Projects</p>
          <p className="text-2xl font-bold">{stats.totalProjects}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-green-500">
          <p className="text-gray-500">User Stories</p>
          <p className="text-2xl font-bold">{stats.totalStories}</p>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-purple-500">
          <p className="text-gray-500">Test Cases</p>
          <p className="text-2xl font-bold">{stats.totalTestCases}</p>
        </div>
      </div>

      {/* Table: User Stories by Project */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">📁 User Stories by Project</h3>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-3 py-2">Project</th>
              <th className="border px-3 py-2"># of Stories</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.storiesByProject || {}).map(([projectName, count], idx) => (
              <tr key={idx}>
                <td className="border px-3 py-2">{projectName || "Unassigned"}</td>
                <td className="border px-3 py-2 text-center">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table: Test Cases by User Story */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">🧪 Test Cases by User Story</h3>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-3 py-2">User Story ID</th>
              <th className="border px-3 py-2"># of Test Cases</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.testCasesByStory || {}).map(([storyId, count], idx) => (
              <tr key={idx}>
                <td className="border px-3 py-2">{storyId}</td>
                <td className="border px-3 py-2 text-center">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Table: Test Cases by Project */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-2 text-gray-800">📦 Test Cases by Project</h3>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-3 py-2">Project</th>
              <th className="border px-3 py-2"># of Test Cases</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(stats.testCasesByProject || {}).map(([projectName, count], idx) => (
              <tr key={idx}>
                <td className="border px-3 py-2">{projectName || "Unassigned"}</td>
                <td className="border px-3 py-2 text-center">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
