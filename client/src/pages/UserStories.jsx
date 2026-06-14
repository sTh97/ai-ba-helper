import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import Pagination from "../components/Pagination";
import { getPageSlice, getTotalPages } from "../utils/pagination";

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", color: "var(--text-primary)",
  fontSize: 13, outline: "none", fontFamily: "inherit",
  transition: "border-color 0.15s", boxSizing: "border-box",
};

const focusHandlers = {
  onFocus: (e) => (e.target.style.borderColor = "var(--accent)"),
  onBlur: (e) => (e.target.style.borderColor = "var(--border)"),
};

const toDayStart = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
};

const toDayEnd = (dateStr) => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
};

const UserStories = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canUpdate = hasPermission("stories", "update");
  const canDelete = hasPermission("stories", "delete");

  const [stories, setStories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [expandedStory, setExpandedStory] = useState(null);

  const [filterProject, setFilterProject] = useState("");
  const [filterFeature, setFilterFeature] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterDescription, setFilterDescription] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const hasActiveFilters = filterProject || filterFeature || filterDateFrom || filterDateTo || filterDescription.trim();

  const featureOptions = useMemo(() => {
    const set = new Set();
    stories.forEach((s) => {
      const f = (s.feature || "").trim();
      if (f) set.add(f);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [stories]);

  const fetchData = async () => {
    try {
      const [storiesRes, projectsRes] = await Promise.all([
        axios.get("/stories"),
        axios.get("/projects"),
      ]);
      setStories(storiesRes.data);
      setProjects(projectsRes.data);
    } catch (e) {
      console.error("Error fetching stories:", e);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEdit = (story) => {
    navigate("/add-user-story", { state: { story } });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this story?")) return;
    try {
      await axios.delete(`/stories/${id}`);
      fetchData();
    } catch {
      alert("Failed to delete story");
    }
  };

  const clearFilters = () => {
    setFilterProject("");
    setFilterFeature("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterDescription("");
    setPage(1);
  };

  useEffect(() => { setPage(1); }, [filterProject, filterFeature, filterDateFrom, filterDateTo, filterDescription, pageSize]);

  const filteredStories = useMemo(() => {
    const from = toDayStart(filterDateFrom);
    const to = toDayEnd(filterDateTo);
    const desc = filterDescription.trim().toLowerCase();

    return stories.filter((s) => {
      if (filterProject) {
        const projectId = s.projectId?._id || s.projectId;
        if (projectId !== filterProject) return false;
      }

      if (filterFeature) {
        if ((s.feature || "").trim() !== filterFeature) return false;
      }

      if (from || to) {
        const created = new Date(s.createdAt);
        if (from && created < from) return false;
        if (to && created > to) return false;
      }

      if (desc) {
        const text = `${s.originalText || ""} ${s.correctedText || ""}`.toLowerCase();
        if (!text.includes(desc)) return false;
      }

      return true;
    });
  }, [stories, filterProject, filterFeature, filterDateFrom, filterDateTo, filterDescription]);

  const totalPages = getTotalPages(filteredStories.length, pageSize);
  const safePage = Math.min(page, totalPages);
  const paginatedStories = getPageSlice(filteredStories, safePage, pageSize);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "var(--text-primary)", margin: 0 }}>
          User Stories
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          Browse and manage all existing user stories
        </p>
      </div>

      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", overflow: "hidden",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
              Existing Stories
              <span style={{
                marginLeft: 8, fontSize: 11, padding: "2px 8px",
                background: "var(--bg-elevated)", borderRadius: 99, color: "var(--text-muted)",
              }}>
                {hasActiveFilters ? `${filteredStories.length} / ${stories.length}` : stories.length}
              </span>
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 12,
                  background: "var(--bg-elevated)", border: "1px solid var(--border)",
                  color: "var(--text-secondary)", cursor: "pointer",
                }}
              >
                Clear filters
              </button>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 5, fontWeight: 500 }}>
                Project
              </label>
              <select
                style={{ ...inputStyle, fontSize: 12, padding: "8px 12px", cursor: "pointer" }}
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                {...focusHandlers}
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 5, fontWeight: 500 }}>
                Feature
              </label>
              <select
                style={{ ...inputStyle, fontSize: 12, padding: "8px 12px", cursor: "pointer" }}
                value={filterFeature}
                onChange={(e) => setFilterFeature(e.target.value)}
                {...focusHandlers}
              >
                <option value="">All features</option>
                {featureOptions.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 5, fontWeight: 500 }}>
                User story description
              </label>
              <input
                type="text"
                style={{ ...inputStyle, fontSize: 12, padding: "8px 12px" }}
                placeholder="Search in story text…"
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
                {...focusHandlers}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 5, fontWeight: 500 }}>
                Date from
              </label>
              <input
                type="date"
                style={{ ...inputStyle, fontSize: 12, padding: "8px 12px" }}
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                {...focusHandlers}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginBottom: 5, fontWeight: 500 }}>
                Date to
              </label>
              <input
                type="date"
                style={{ ...inputStyle, fontSize: 12, padding: "8px 12px" }}
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                min={filterDateFrom || undefined}
                {...focusHandlers}
              />
            </div>
          </div>
        </div>

        {filteredStories.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            {hasActiveFilters ? "No stories match your filters." : "No stories yet."}
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {paginatedStories.map((story, i) => (
                <StoryCard
                  key={story._id}
                  story={story}
                  isLast={i === paginatedStories.length - 1}
                  expanded={expandedStory === story._id}
                  onToggle={() => setExpandedStory(expandedStory === story._id ? null : story._id)}
                  onEdit={canUpdate ? () => handleEdit(story) : null}
                  onDelete={canDelete ? () => handleDelete(story._id) : null}
                />
              ))}
            </div>
            <Pagination
              totalItems={filteredStories.length}
              page={safePage}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>
    </div>
  );
};

const StoryCard = ({ story, isLast, expanded, onToggle, onEdit, onDelete }) => (
  <div style={{ borderBottom: isLast ? "none" : "1px solid var(--border)" }}>
    <div
      onClick={onToggle}
      style={{
        padding: "14px 20px", cursor: "pointer",
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-elevated)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
          <span style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 99,
            background: "var(--bg-elevated)", color: "var(--text-muted)",
          }}>{story.projectId?.name || "Unassigned"}</span>
          {(story.feature || "").trim() && (
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 99,
              background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600,
            }}>{story.feature}</span>
          )}
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {new Date(story.createdAt).toLocaleDateString()}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-primary)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {story.correctedText || story.originalText}
        </p>
      </div>
      <span style={{ color: "var(--text-muted)", fontSize: 12, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.18s", flexShrink: 0 }}>▾</span>
    </div>

    {expanded && (
      <div style={{ padding: "0 20px 16px", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
        {story.originalText && story.originalText !== story.correctedText && (
          <div style={{ marginBottom: 14 }}>
            <Label>Original Text</Label>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{story.originalText}</p>
          </div>
        )}
        {story.correctedText && (
          <div style={{ marginBottom: 14 }}>
            <Label>User Story</Label>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{story.correctedText}</p>
          </div>
        )}
        <MiniTable title="Acceptance Criteria" rows={(story.acceptanceCriteria || []).map((c, i) => [i + 1, c])} />

        {(story.fields || []).length > 0 && (
          <div style={{ marginTop: 12 }}>
            <Label>Field Level Description</Label>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {story.fields.map((f, i) => (
                <div key={i} style={{
                  padding: "7px 10px", borderRadius: 7, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4,
                  background: "var(--bg-elevated)", border: "1px solid var(--border)",
                }}>
                  <strong style={{ color: "var(--text-primary)" }}>{f.name || "—"}</strong>
                  {f.type && (
                    <span style={{
                      marginLeft: 6, fontSize: 10, padding: "1px 7px", borderRadius: 99,
                      background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600,
                    }}>{f.type}</span>
                  )}
                  {f.description && <span style={{ color: "var(--text-muted)" }}> — {f.description}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <MiniTable title="Business Rules" rows={(story.businessRules || []).map((t) => [t])} hideEmpty />
          <MiniTable title="Validation" rows={(story.validations || []).map((t) => [t])} hideEmpty />
          <MiniTable title="Edge Cases" rows={(story.edgeCases || []).map((t) => [t])} hideEmpty />
          <MiniTable title="Constraints" rows={(story.constraints || []).map((t) => [t])} hideEmpty />
          <MiniTable title="Dependencies" rows={(story.dependencies || []).map((t) => [t])} hideEmpty />
          {story.businessImpact && (
            <div>
              <Label>Business Impact</Label>
              <div style={{
                padding: "7px 10px", borderRadius: 7, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4,
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
              }}>{story.businessImpact}</div>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <MiniTable title="Definition of Ready (DoR)" rows={(story.definitionOfReady || []).map((t) => [t])} type="positive" hideEmpty />
          <MiniTable title="Definition of Done (DoD)" rows={(story.definitionOfDone || []).map((t) => [t])} type="positive" hideEmpty />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
          <MiniTable title="Positive Tests" rows={(story.happyTests || []).map((t) => [t])} type="positive" />
          <MiniTable title="Negative Tests" rows={(story.negativeTests || []).map((t) => [t])} type="negative" />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              style={{
                padding: "6px 14px", borderRadius: 7,
                background: "var(--accent-soft)", border: "1px solid var(--accent)22",
                color: "var(--accent)", fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
            >Edit</button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{
                padding: "6px 14px", borderRadius: 7,
                background: "var(--red-soft)", border: "1px solid var(--red)22",
                color: "var(--red)", fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
            >Delete</button>
          )}
          <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>
            Created {new Date(story.createdAt).toLocaleDateString()}
            {story.updatedAt && ` · Updated ${new Date(story.updatedAt).toLocaleDateString()}`}
          </span>
        </div>
      </div>
    )}
  </div>
);

const Label = ({ children }) => (
  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 6 }}>
    {children}
  </div>
);

const MiniTable = ({ title, rows, type, hideEmpty }) => {
  if (hideEmpty && rows.length === 0) return null;
  return (
  <div>
    <Label>{title}</Label>
    {rows.length === 0 ? (
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>None</div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {rows.map((row, i) => (
          <div key={i} style={{
            padding: "7px 10px", borderRadius: 7, fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4,
            background: type === "positive" ? "var(--green-soft)" : type === "negative" ? "var(--red-soft)" : "var(--bg-elevated)",
            border: `1px solid ${type === "positive" ? "var(--green)" : type === "negative" ? "var(--red)" : "var(--border)"}22`,
          }}>
            {row.length > 1 ? <><strong style={{ color: "var(--text-muted)" }}>{row[0]}.</strong> {row[1]}</> : row[0]}
          </div>
        ))}
      </div>
    )}
  </div>
  );
};

export default UserStories;
