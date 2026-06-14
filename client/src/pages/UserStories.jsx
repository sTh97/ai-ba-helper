import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import Pagination from "../components/Pagination";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";
import ConfirmButton from "../components/ConfirmButton";
import { getPageSlice, getTotalPages } from "../utils/pagination";

const fieldStyle = {
  height: 34, padding: "0 10px", boxSizing: "border-box",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", color: "var(--text-primary)",
  fontSize: 12, outline: "none", fontFamily: "inherit",
  transition: "border-color 0.15s",
};

const focusHandlers = {
  onFocus: (e) => (e.target.style.borderColor = "var(--accent)"),
  onBlur: (e) => (e.target.style.borderColor = "var(--border)"),
};

const STATUS_COLOR = {
  draft: "var(--text-muted)",
  reviewed: "var(--green)",
  pending: "var(--yellow)",
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

const ListIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const UserStories = () => {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
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

  const projectName = (id) => projects.find((p) => p._id === id)?.name || id;

  const activeChips = [
    filterProject && { key: "project", label: `Project: ${projectName(filterProject)}`, clear: () => setFilterProject("") },
    filterFeature && { key: "feature", label: `Feature: ${filterFeature}`, clear: () => setFilterFeature("") },
    filterDescription.trim() && { key: "desc", label: `Text: "${filterDescription.trim()}"`, clear: () => setFilterDescription("") },
    filterDateFrom && { key: "from", label: `From: ${filterDateFrom}`, clear: () => setFilterDateFrom("") },
    filterDateTo && { key: "to", label: `To: ${filterDateTo}`, clear: () => setFilterDateTo("") },
  ].filter(Boolean);

  const hasActiveFilters = activeChips.length > 0;

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
    try {
      await axios.delete(`/stories/${id}`);
      showToast("Story deleted");
      fetchData();
    } catch {
      showToast("Failed to delete story", "error");
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
      if (filterFeature && (s.feature || "").trim() !== filterFeature) return false;
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
    <div className="ba-page" style={{ maxWidth: 920, margin: "0 auto" }}>
      <PageHeader
        title="User Stories"
        subtitle="Browse and manage all existing user stories"
      />

      {/* Filter bar */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "14px 16px", marginBottom: 16,
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <select style={{ ...fieldStyle, cursor: "pointer", flex: "1 1 150px" }} value={filterProject} onChange={(e) => setFilterProject(e.target.value)} {...focusHandlers}>
            <option value="">All projects</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <select style={{ ...fieldStyle, cursor: "pointer", flex: "1 1 150px" }} value={filterFeature} onChange={(e) => setFilterFeature(e.target.value)} {...focusHandlers}>
            <option value="">All features</option>
            {featureOptions.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
          <input style={{ ...fieldStyle, flex: "2 1 180px" }} placeholder="Search story text…" value={filterDescription} onChange={(e) => setFilterDescription(e.target.value)} {...focusHandlers} />
          <input type="date" style={{ ...fieldStyle, flex: "1 1 130px" }} value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} {...focusHandlers} />
          <input type="date" style={{ ...fieldStyle, flex: "1 1 130px" }} value={filterDateTo} min={filterDateFrom || undefined} onChange={(e) => setFilterDateTo(e.target.value)} {...focusHandlers} />
        </div>

        {hasActiveFilters && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12, alignItems: "center" }}>
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                onClick={chip.clear}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "4px 6px 4px 10px", borderRadius: 99, fontSize: 11,
                  background: "var(--accent-soft)", border: "1px solid var(--accent)22",
                  color: "var(--accent)", cursor: "pointer", fontWeight: 500,
                }}
              >
                {chip.label}
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  width: 14, height: 14, borderRadius: 99, background: "var(--accent)22", fontSize: 10,
                }}>✕</span>
              </button>
            ))}
            <button
              onClick={clearFilters}
              style={{
                padding: "4px 10px", borderRadius: 99, fontSize: 11,
                background: "transparent", border: "1px solid var(--border)",
                color: "var(--text-muted)", cursor: "pointer",
              }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* List */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", overflow: "hidden",
      }}>
        <div style={{
          padding: "14px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
            Stories
          </span>
          <span style={{ fontSize: 11, padding: "2px 8px", background: "var(--bg-elevated)", borderRadius: 99, color: "var(--text-muted)" }}>
            {hasActiveFilters ? `${filteredStories.length} / ${stories.length}` : stories.length}
          </span>
        </div>

        {filteredStories.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              icon={<ListIcon />}
              message="No stories match your filters"
              hint="Try removing a filter to widen your search."
              actionLabel="Clear all filters"
              onAction={clearFilters}
            />
          ) : (
            <EmptyState
              icon={<ListIcon />}
              message="No user stories yet"
              hint="Generate your first story from a brief or requirements note."
              actionLabel="Add a story →"
              onAction={() => navigate("/add-user-story")}
            />
          )
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
              entityLabel="stories"
            />
          </>
        )}
      </div>
    </div>
  );
};

const Chip = ({ children, color = "var(--text-muted)" }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 11, padding: "2px 8px", borderRadius: 99,
    background: "var(--bg-elevated)", color,
  }}>
    {children}
  </span>
);

const StoryCard = ({ story, isLast, expanded, onToggle, onEdit, onDelete }) => {
  const [hover, setHover] = useState(false);
  const status = (story.status || "draft").toLowerCase();
  const accent = STATUS_COLOR[status] || STATUS_COLOR.draft;
  const acCount = (story.acceptanceCriteria || []).length;
  const testCount = (story.happyTests || []).length + (story.negativeTests || []).length;
  const hasWireframe = Boolean(story.wireframe?.fullDocument || story.wireframe?.html);
  const shortId = (story._id || "").slice(-6).toUpperCase();

  return (
    <div
      style={{ borderBottom: isLast ? "none" : "1px solid var(--border)", borderLeft: `3px solid ${accent}` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        onClick={onToggle}
        style={{
          padding: "14px 18px", cursor: "pointer", position: "relative",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
          transition: "background 0.12s",
          background: hover ? "var(--bg-elevated)" : "transparent",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
            {(story.feature || "").trim() && (
              <span style={{
                fontSize: 11, padding: "2px 8px", borderRadius: 99,
                background: "var(--accent-soft)", color: "var(--accent)", fontWeight: 600,
              }}>{story.feature}</span>
            )}
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: "var(--bg-elevated)", color: "var(--text-muted)" }}>
              {story.projectId?.name || "Unassigned"}
            </span>
            <span className="ba-mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>#{shortId}</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>
              {new Date(story.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {story.correctedText || story.originalText}
          </p>
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            <Chip color={acCount ? "var(--text-secondary)" : "var(--text-muted)"}>{acCount} criteria</Chip>
            <Chip color={testCount ? "var(--text-secondary)" : "var(--text-muted)"}>{testCount} tests</Chip>
            {hasWireframe && <Chip color="var(--ai-accent)">✦ wireframe</Chip>}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {(onEdit || onDelete) && (
            <div style={{
              display: "flex", gap: 6,
              opacity: hover || expanded ? 1 : 0,
              transition: "opacity 0.12s",
              pointerEvents: hover || expanded ? "auto" : "none",
            }}>
              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  style={{
                    padding: "5px 12px", borderRadius: 6,
                    background: "var(--accent-soft)", border: "1px solid var(--accent)22",
                    color: "var(--accent)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                  }}
                >Edit</button>
              )}
              {onDelete && <ConfirmButton onConfirm={onDelete} />}
            </div>
          )}
          <span style={{ color: "var(--text-muted)", fontSize: 12, transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.18s" }}>▾</span>
        </div>
      </div>

      <div style={{
        maxHeight: expanded ? 4000 : 0, overflow: "hidden",
        transition: "max-height 0.18s ease",
      }}>
        <div style={{ padding: "0 18px 16px", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
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
            {onDelete && <ConfirmButton onConfirm={onDelete} style={{ padding: "6px 14px" }} />}
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--text-muted)" }}>
              Created {new Date(story.createdAt).toLocaleDateString()}
              {story.updatedAt && ` · Updated ${new Date(story.updatedAt).toLocaleDateString()}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

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
