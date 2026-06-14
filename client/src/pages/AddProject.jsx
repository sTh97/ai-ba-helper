import { useState, useEffect } from "react";
import axios from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import Pagination from "../components/Pagination";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import ConfirmButton from "../components/ConfirmButton";
import { getPageSlice, getTotalPages } from "../utils/pagination";

const DESC_LIMIT = 280;

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", color: "var(--text-primary)",
  fontSize: 13, outline: "none", fontFamily: "inherit",
  transition: "border-color 0.15s", boxSizing: "border-box",
};

const focusOn = (e) => (e.target.style.borderColor = "var(--accent)");
const focusOff = (e) => (e.target.style.borderColor = "var(--border)");

const FolderIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);

const AddProject = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const canCreate = hasPermission("projects", "create");
  const canUpdate = hasPermission("projects", "update");
  const canDelete = hasPermission("projects", "delete");

  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [saving, setSaving] = useState(false);
  const [hoverRow, setHoverRow] = useState(null);

  const fetchProjects = async () => {
    try {
      const res = await axios.get("/projects");
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  useEffect(() => { fetchProjects(); }, []);
  useEffect(() => { setPage(1); }, [search, pageSize]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`/projects/${editingId}`, { name, description });
        showToast("Project updated successfully");
      } else {
        await axios.post("/projects", { name, description });
        showToast("Project added successfully");
      }
      setName(""); setDescription(""); setEditingId(null);
      fetchProjects();
    } catch {
      showToast("Failed to save project", "error");
    } finally { setSaving(false); }
  };

  const handleEdit = (project) => {
    setName(project.name);
    setDescription(project.description || "");
    setEditingId(project._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/projects/${id}`);
      showToast("Project deleted");
      if (editingId === id) { setName(""); setDescription(""); setEditingId(null); }
      fetchProjects();
    } catch {
      showToast("Failed to delete project", "error");
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = getTotalPages(filteredProjects.length, pageSize);
  const safePage = Math.min(page, totalPages);
  const paginatedProjects = getPageSlice(filteredProjects, safePage, pageSize);

  return (
    <div className="ba-page" style={{ maxWidth: 880, margin: "0 auto" }}>
      <PageHeader
        title={editingId ? "Edit Project" : "Projects"}
        subtitle={editingId ? "Modify the project details below" : "Manage your business analysis projects"}
      />

      {(canCreate || (canUpdate && editingId)) && (
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "22px 24px", marginBottom: 20,
        }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text-primary)", margin: "0 0 16px" }}>
            {editingId ? "Update Project" : "New Project"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="text"
              style={inputStyle}
              placeholder="Project name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={focusOn} onBlur={focusOff}
            />
            <div>
              <textarea
                style={{ ...inputStyle, resize: "vertical", minHeight: 88 }}
                placeholder="Description (optional)"
                value={description}
                maxLength={DESC_LIMIT}
                onChange={(e) => setDescription(e.target.value)}
                onFocus={focusOn} onBlur={focusOff}
              />
              <div style={{ textAlign: "right", fontSize: 11, color: description.length > DESC_LIMIT - 30 ? "var(--yellow)" : "var(--text-muted)", marginTop: 4 }}>
                {description.length} / {DESC_LIMIT}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleSubmit}
                disabled={saving || !name.trim()}
                style={{
                  padding: "9px 20px", borderRadius: "var(--radius)",
                  background: "var(--accent)", border: "none", color: "white",
                  fontWeight: 600, fontSize: 13, opacity: (saving || !name.trim()) ? 0.5 : 1,
                  cursor: (saving || !name.trim()) ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving…" : editingId ? "Update Project" : "Create Project"}
              </button>
              {editingId && (
                <button
                  onClick={() => { setName(""); setDescription(""); setEditingId(null); }}
                  style={{
                    padding: "9px 16px", borderRadius: "var(--radius)",
                    background: "var(--bg-elevated)", border: "1px solid var(--border)",
                    color: "var(--text-secondary)", fontWeight: 500, fontSize: 13,
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", overflow: "hidden",
      }}>
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
            All Projects
            <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", background: "var(--bg-elevated)", borderRadius: 99, color: "var(--text-muted)" }}>
              {projects.length}
            </span>
          </span>
          <input
            type="text"
            style={{ ...inputStyle, width: 220, fontSize: 12, padding: "7px 12px" }}
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={focusOn} onBlur={focusOff}
          />
        </div>

        {filteredProjects.length === 0 ? (
          <EmptyState
            icon={<FolderIcon />}
            message={search ? "No projects match your search" : "No projects yet"}
            hint={search ? "Try a different search term." : "Create your first project using the form above."}
          />
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {paginatedProjects.map((project) => (
                <div
                  key={project._id}
                  onMouseEnter={() => setHoverRow(project._id)}
                  onMouseLeave={() => setHoverRow(null)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "13px 20px", borderBottom: "1px solid var(--border)",
                    background: hoverRow === project._id ? "var(--bg-elevated)" : "transparent",
                    transition: "background 0.12s",
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
                      {project.name}
                    </div>
                    <div style={{
                      fontSize: 12, color: "var(--text-secondary)", marginTop: 2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 460,
                    }}>
                      {project.description || <span style={{ color: "var(--text-muted)" }}>No description</span>}
                    </div>
                  </div>
                  <span className="ba-mono" style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                  {(canUpdate || canDelete) && (
                    <div style={{
                      display: "flex", gap: 6, flexShrink: 0,
                      opacity: hoverRow === project._id ? 1 : 0,
                      transition: "opacity 0.12s",
                      pointerEvents: hoverRow === project._id ? "auto" : "none",
                    }}>
                      {canUpdate && (
                        <button
                          onClick={() => handleEdit(project)}
                          style={{
                            padding: "5px 12px", borderRadius: 6,
                            background: "var(--accent-soft)", border: "1px solid var(--accent)22",
                            color: "var(--accent)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                          }}
                        >Edit</button>
                      )}
                      {canDelete && <ConfirmButton onConfirm={() => handleDelete(project._id)} />}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Pagination
              totalItems={filteredProjects.length}
              page={safePage}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              entityLabel="projects"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default AddProject;
