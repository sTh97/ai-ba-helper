import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Folder, List, TestTube2 } from "lucide-react";
import axios from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import Table from "../components/Table";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};

const StatCard = ({ label, value, color, icon: Icon, delta }) => (
  <div
    className="bg-surface border border-border rounded-lg p-5 flex items-center gap-4"
    style={{ borderLeft: `3px solid ${color}` }}
  >
    <div
      className="w-[42px] h-[42px] rounded-[10px] shrink-0 flex items-center justify-center"
      style={{ color, background: `${color}18` }}
    >
      <Icon size={18} strokeWidth={1.75} />
    </div>
    <div className="min-w-0">
      <div className="text-[11px] text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[28px] font-bold text-primary leading-none">
          {value ?? "—"}
        </span>
        {delta != null && (
          <span className="text-[11px] font-semibold text-green bg-green-soft px-1.5 py-0.5 rounded-full">
            ↑ {delta}%
          </span>
        )}
      </div>
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
    <div className="flex items-center justify-center min-h-[300px]">
      <Spinner />
    </div>
  );

  if (!stats) return (
    <div className="text-center py-12 text-muted">Failed to load dashboard.</div>
  );

  const storiesByProject = Object.entries(stats.storiesByProject || {});
  const testsByStory = Object.entries(stats.testCasesByStory || {});
  const testsByProject = Object.entries(stats.testCasesByProject || {});
  const isEmpty = !stats.totalProjects && !stats.totalStories && !stats.totalTestCases;

  return (
    <div className="ba-page max-w-[1000px] mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle={`${greeting()}${user?.firstName ? `, ${user.firstName}` : ""} — here's your workspace at a glance.`}
      />

      {isEmpty ? (
        <div className="bg-surface border border-border rounded-lg">
          <EmptyState
            icon={<Folder size={20} strokeWidth={1.75} />}
            message="Your workspace is empty"
            hint="Create your first project to start generating user stories and specifications."
            actionLabel="Create your first project"
            onAction={() => navigate("/add-project")}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5 mb-6">
            <StatCard label="Projects" value={stats.totalProjects} color="var(--accent)" icon={Folder} delta={12} />
            <StatCard label="User stories" value={stats.totalStories} color="var(--green)" icon={List} delta={8} />
            <StatCard label="Test cases" value={stats.totalTestCases} color="var(--yellow)" icon={TestTube2} delta={5} />
          </div>

          <div className="grid gap-3.5">
            <Table
              title="User stories by project"
              icon={Folder}
              headers={["Project", "Stories"]}
              rows={storiesByProject.map(([k, v]) => [k || "Unassigned", v])}
            />
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3.5">
              <Table
                title="Test cases by user story"
                icon={List}
                headers={["Story ID", "Tests"]}
                rows={testsByStory.map(([k, v]) => [k, v])}
              />
              <Table
                title="Test cases by project"
                icon={TestTube2}
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
  <div
    className="w-7 h-7 rounded-full border-2 border-border border-t-accent animate-spin"
    style={{ animation: "spin 0.7s linear infinite" }}
  />
);

export default Dashboard;
