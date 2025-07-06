// import { useState, useEffect } from "react";
// import axios from "../api/axiosInstance";

// const AddProject = () => {
//   const [name, setName] = useState("");
//   const [description, setDescription] = useState("");
//   const [projects, setProjects] = useState([]);

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
//       await axios.post("/projects", { name, description });
//       alert("✅ Project added");
//       setName("");
//       setDescription("");
//       fetchProjects(); // Refresh project list
//     } catch (err) {
//       alert("❌ Failed to add project");
//     }
//   };

//   return (
//     <div className="space-y-10 max-w-4xl mx-auto py-10">
//       {/* Add New Project Form */}
//       <div className="p-6 bg-white shadow rounded">
//         <h2 className="text-xl font-bold mb-4">🧩 Add New Project</h2>
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
//           Add Project
//         </button>
//       </div>

//       {/* Existing Projects */}
//       <div className="p-6 bg-white shadow rounded">
//         <h2 className="text-xl font-bold mb-4">📋 Existing Projects</h2>
//         {projects.length === 0 ? (
//           <p className="text-gray-500">No projects found.</p>
//         ) : (
//           // <ul className="space-y-4">
//           //   {projects.map((project) => (
//           //     <li key={project._id} className="border p-4 rounded bg-gray-50">
//           //       <h3 className="text-lg font-semibold">{project.name}</h3>
//           //       <p className="text-sm text-gray-600">{project.description}</p>
//           //       <p className="text-xs text-gray-500 mt-1">
//           //         Created: {new Date(project.createdAt).toLocaleString()}
//           //       </p>
//           //     </li>
//           //   ))}
//           // </ul>
//           <table className="table-auto w-full border text-sm">
//   <thead>
//     <tr className="bg-gray-200 text-left">
//       <th className="border px-4 py-2">S.No</th>
//       <th className="border px-4 py-2">Project Name</th>
//       <th className="border px-4 py-2">Description</th>
//       <th className="border px-4 py-2">Created At</th>
//     </tr>
//   </thead>
//   <tbody>
//     {projects.map((project, index) => (
//       <tr key={project._id} className="bg-white hover:bg-gray-50">
//         <td className="border px-4 py-2 text-center">{index + 1}</td>
//         <td className="border px-4 py-2">{project.name}</td>
//         <td className="border px-4 py-2">{project.description}</td>
//         <td className="border px-4 py-2">{new Date(project.createdAt).toLocaleString()}</td>
//       </tr>
//     ))}
//   </tbody>
// </table>

//         )}
//       </div>
//     </div>
//   );
// };

// export default AddProject;


import { useState, useEffect } from "react";
import axios from "../api/axiosInstance";

const AddProject = () => {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");

  const fetchProjects = async () => {
    try {
      const res = await axios.get("/projects");
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    try {
      if (editingId) {
        await axios.put(`/projects/${editingId}`, { name, description });
        alert("✅ Project updated");
      } else {
        await axios.post("/projects", { name, description });
        alert("✅ Project added");
      }
      setName("");
      setDescription("");
      setEditingId(null);
      fetchProjects();
    } catch (err) {
      alert("❌ Failed to save project");
    }
  };

  const handleEdit = (project) => {
    setName(project.name);
    setDescription(project.description);
    setEditingId(project._id);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to delete?");
    if (!confirm) return;

    try {
      await axios.delete(`/api/projects/${id}`);
      alert("🗑️ Project deleted");
      fetchProjects();
    } catch (err) {
      alert("❌ Failed to delete project");
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 max-w-5xl mx-auto py-10">
      {/* Add or Update Project */}
      <div className="p-6 bg-white shadow rounded">
        <h2 className="text-xl font-bold mb-4">
          {editingId ? "✏️ Update Project" : "🧩 Add New Project"}
        </h2>
        <input
          type="text"
          className="w-full border p-2 mb-3"
          placeholder="Project Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="w-full border p-2 mb-3"
          placeholder="Project Description"
          rows="4"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {editingId ? "Update Project" : "Add Project"}
        </button>
        {editingId && (
          <button
            onClick={() => {
              setName("");
              setDescription("");
              setEditingId(null);
            }}
            className="ml-3 bg-gray-400 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Project List with Search */}
      <div className="p-6 bg-white shadow rounded">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">📋 Existing Projects</h2>
          <input
            type="text"
            className="border p-2 rounded w-64"
            placeholder="🔍 Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filteredProjects.length === 0 ? (
          <p className="text-gray-500">No matching projects found.</p>
        ) : (
          <table className="table-auto w-full border text-sm">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="border px-4 py-2">S.No</th>
                <th className="border px-4 py-2">Project Name</th>
                <th className="border px-4 py-2">Description</th>
                <th className="border px-4 py-2">Created At</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project, index) => (
                <tr key={project._id} className="bg-white hover:bg-gray-50">
                  <td className="border px-4 py-2 text-center">{index + 1}</td>
                  <td className="border px-4 py-2">{project.name}</td>
                  <td className="border px-4 py-2">{project.description}</td>
                  <td className="border px-4 py-2">
                    {new Date(project.createdAt).toLocaleString()}
                  </td>
                  <td className="border px-4 py-2 space-x-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(project._id)}
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AddProject;
