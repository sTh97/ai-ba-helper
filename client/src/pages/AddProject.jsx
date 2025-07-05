import { useState, useEffect } from "react";
import axios from "../api/axiosInstance";

const AddProject = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [projects, setProjects] = useState([]);

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
      await axios.post("/projects", { name, description });
      alert("✅ Project added");
      setName("");
      setDescription("");
      fetchProjects(); // Refresh project list
    } catch (err) {
      alert("❌ Failed to add project");
    }
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto py-10">
      {/* Add New Project Form */}
      <div className="p-6 bg-white shadow rounded">
        <h2 className="text-xl font-bold mb-4">🧩 Add New Project</h2>
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
          Add Project
        </button>
      </div>

      {/* Existing Projects */}
      <div className="p-6 bg-white shadow rounded">
        <h2 className="text-xl font-bold mb-4">📋 Existing Projects</h2>
        {projects.length === 0 ? (
          <p className="text-gray-500">No projects found.</p>
        ) : (
          <ul className="space-y-4">
            {projects.map((project) => (
              <li key={project._id} className="border p-4 rounded bg-gray-50">
                <h3 className="text-lg font-semibold">{project.name}</h3>
                <p className="text-sm text-gray-600">{project.description}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Created: {new Date(project.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AddProject;
