// import { useState, useEffect } from "react";
// import axios from "../api/axiosInstance";

// const AddProject = () => {
//   const [projects, setProjects] = useState([]);
//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");
//   const [editingId, setEditingId] = useState(null);
//   const [search, setSearch] = useState("");

//   const fetchProjects = async () => {
//     try {
//       const res = await axios.get("/projects");
//       setProjects(res.data);
//     } catch (err) {
//       console.error("Failed to fetch projects:", err);
//     }
//   };

//   useEffect(() => {
//     fetchProjects();
//   }, []);

//   const handleSubmit = async () => {
//     if (!name.trim()) return;

//     try {
//       if (editingId) {
//         await axios.put(`/projects/${editingId}`, { name, description });
//         alert("✅ Project updated");
//       } else {
//         await axios.post("/projects", { name, description });
//         alert("✅ Project added");
//       }
//       setName("");
//       setDescription("");
//       setEditingId(null);
//       fetchProjects();
//     } catch (err) {
//       alert("❌ Failed to save project");
//     }
//   };

//   const handleEdit = (project) => {
//     setName(project.name);
//     setDescription(project.description);
//     setEditingId(project._id);
//   };

//   const handleDelete = async (id) => {
//     const confirm = window.confirm("Are you sure you want to delete?");
//     if (!confirm) return;

//     try {
//       await axios.delete(`/api/projects/${id}`);
//       alert("🗑️ Project deleted");
//       fetchProjects();
//     } catch (err) {
//       alert("❌ Failed to delete project");
//     }
//   };

//   const filteredProjects = projects.filter((p) =>
//     p.name.toLowerCase().includes(search.toLowerCase())
//   );

//   return (
//     <div className="space-y-10 max-w-5xl mx-auto py-10">
//       {/* Add or Update Project */}
//       <div className="p-6 bg-white shadow rounded">
//         <h2 className="text-xl font-bold mb-4">
//           {editingId ? "✏️ Update Project" : "🧩 Add New Project"}
//         </h2>
//         <input
//           type="text"
//           className="w-full border p-2 mb-3"
//           placeholder="Project Name"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//         />
//         <textarea
//           className="w-full border p-2 mb-3"
//           placeholder="Project Description"
//           rows="4"
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//         />
//         <button
//           onClick={handleSubmit}
//           className="bg-blue-600 text-white px-4 py-2 rounded"
//         >
//           {editingId ? "Update Project" : "Add Project"}
//         </button>
//         {editingId && (
//           <button
//             onClick={() => {
//               setName("");
//               setDescription("");
//               setEditingId(null);
//             }}
//             className="ml-3 bg-gray-400 text-white px-4 py-2 rounded"
//           >
//             Cancel
//           </button>
//         )}
//       </div>

//       {/* Project List with Search */}
//       <div className="p-6 bg-white shadow rounded">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-bold">📋 Existing Projects</h2>
//           <input
//             type="text"
//             className="border p-2 rounded w-64"
//             placeholder="🔍 Search by name..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         {filteredProjects.length === 0 ? (
//           <p className="text-gray-500">No matching projects found.</p>
//         ) : (
//           <table className="table-auto w-full border text-sm">
//             <thead>
//               <tr className="bg-gray-200 text-left">
//                 <th className="border px-4 py-2">S.No</th>
//                 <th className="border px-4 py-2">Project Name</th>
//                 <th className="border px-4 py-2">Description</th>
//                 <th className="border px-4 py-2">Created At</th>
//                 <th className="border px-4 py-2">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredProjects.map((project, index) => (
//                 <tr key={project._id} className="bg-white hover:bg-gray-50">
//                   <td className="border px-4 py-2 text-center">{index + 1}</td>
//                   <td className="border px-4 py-2">{project.name}</td>
//                   <td className="border px-4 py-2">{project.description}</td>
//                   <td className="border px-4 py-2">
//                     {new Date(project.createdAt).toLocaleString()}
//                   </td>
//                   <td className="border px-4 py-2 space-x-2">
//                     <button
//                       onClick={() => handleEdit(project)}
//                       className="bg-yellow-500 text-white px-3 py-1 rounded"
//                     >
//                       Edit
//                     </button>
//                     <button
//                       onClick={() => handleDelete(project._id)}
//                       className="bg-red-600 text-white px-3 py-1 rounded"
//                     >
//                       Delete
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AddProject;


import { useState, useEffect } from "react";
import axios from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import Pagination from "../components/Pagination";
import { getPageSlice, getTotalPages } from "../utils/pagination";

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", color: "var(--text-primary)",
  fontSize: 13, outline: "none", fontFamily: "inherit",
  transition: "border-color 0.15s",
  boxSizing: "border-box",
};

const AddProject = () => {
  const { hasPermission } = useAuth();
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
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

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
    setDescription(project.description);
    setEditingId(project._id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await axios.delete(`/projects/${id}`);
      showToast("Project deleted");
      fetchProjects();
    } catch {
      showToast("Failed to delete project", "error");
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = getTotalPages(filteredProjects.length, pageSize);
  const safePage = Math.min(page, totalPages);
  const paginatedProjects = getPageSlice(filteredProjects, safePage, pageSize);

  return (
    <div style={{ maxWidth: 880, margin: "0 auto" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 999,
          padding: "12px 20px", borderRadius: "var(--radius)",
          background: toast.type === "error" ? "var(--red-soft)" : "var(--green-soft)",
          border: `1px solid ${toast.type === "error" ? "var(--red)" : "var(--green)"}`,
          color: toast.type === "error" ? "var(--red)" : "var(--green)",
          fontSize: 13, fontWeight: 500,
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          {toast.type === "error" ? "✗ " : "✓ "}{toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "var(--text-primary)", margin: 0 }}>
          {editingId ? "Edit Project" : "Projects"}
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          {editingId ? "Modify the project details below" : "Manage your business analysis projects"}
        </p>
      </div>

      {/* Form Card */}
      {(canCreate || (canUpdate && editingId)) && <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", padding: "22px 24px", marginBottom: 20,
      }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)", margin: "0 0 16px" }}>
          {editingId ? "Update Project" : "New Project"}
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input
            type="text"
            style={inputStyle}
            placeholder="Project name"
            value={name}
            onChange={e => setName(e.target.value)}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
          <textarea
            style={{ ...inputStyle, resize: "vertical", minHeight: 88 }}
            placeholder="Description (optional)"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button
              onClick={handleSubmit}
              disabled={saving || !name.trim()}
              style={{
                padding: "9px 20px", borderRadius: "var(--radius)",
                background: "var(--accent)", border: "none", color: "white",
                fontWeight: 600, fontSize: 13, opacity: (saving || !name.trim()) ? 0.5 : 1,
                cursor: (saving || !name.trim()) ? "not-allowed" : "pointer",
                transition: "opacity 0.15s",
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
      </div>}

      {/* Project List */}
      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", overflow: "hidden",
      }}>
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
            All Projects
            <span style={{
              marginLeft: 8, fontSize: 11, padding: "2px 8px",
              background: "var(--bg-elevated)", borderRadius: 99, color: "var(--text-muted)",
            }}>{projects.length}</span>
          </span>
          <input
            type="text"
            style={{ ...inputStyle, width: 200, fontSize: 12, padding: "7px 12px" }}
            placeholder="Search projects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={e => (e.target.style.borderColor = "var(--accent)")}
            onBlur={e => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        {filteredProjects.length === 0 ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            {search ? "No projects match your search." : "No projects yet. Create your first one above."}
          </div>
        ) : (
          <>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-elevated)" }}>
                  {["#", "Name", "Description", "Created", ""].map(h => (
                    <th key={h} style={{
                      padding: "10px 16px", textAlign: "left",
                      fontSize: 11, color: "var(--text-muted)",
                      textTransform: "uppercase", letterSpacing: "0.7px",
                      fontWeight: 500, borderBottom: "1px solid var(--border)",
                      whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedProjects.map((project, index) => (
                  <tr key={project._id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 16px", color: "var(--text-muted)", fontSize: 12, width: 40 }}>
                      {(safePage - 1) * pageSize + index + 1}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                      {project.name}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)", maxWidth: 260 }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {project.description || <span style={{ color: "var(--text-muted)" }}>—</span>}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(project)}
                            style={{
                              padding: "5px 12px", borderRadius: 6,
                              background: "var(--accent-soft)", border: "1px solid var(--accent)22",
                              color: "var(--accent)", fontSize: 12, fontWeight: 500,
                            }}
                          >Edit</button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(project._id)}
                            style={{
                              padding: "5px 12px", borderRadius: 6,
                              background: "var(--red-soft)", border: "1px solid var(--red)22",
                              color: "var(--red)", fontSize: 12, fontWeight: 500,
                            }}
                          >Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              totalItems={filteredProjects.length}
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

export default AddProject;