import { useState, useEffect } from "react";
import axios from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", color: "var(--text-primary)",
  fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};

const emptyPermission = (module) => ({
  module,
  create: false,
  read: false,
  update: false,
  delete: false,
  dataAccess: "own",
});

const Roles = () => {
  const { hasPermission } = useAuth();
  const [modules, setModules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission("roles", "create");
  const canUpdate = hasPermission("roles", "update");
  const canDelete = hasPermission("roles", "delete");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const initPermissions = (moduleList) =>
    moduleList.map((m) => emptyPermission(m.key));

  const fetchData = async () => {
    try {
      const [modRes, rolesRes] = await Promise.all([
        axios.get("/roles/modules"),
        axios.get("/roles"),
      ]);
      setModules(modRes.data);
      setRoles(rolesRes.data);
      if (!editingId && permissions.length === 0) {
        setPermissions(initPermissions(modRes.data));
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to load roles", "error");
    }
  };

  useEffect(() => { fetchData(); }, []);

  const togglePerm = (moduleKey, field) => {
    setPermissions((prev) =>
      prev.map((p) =>
        p.module === moduleKey ? { ...p, [field]: !p[field] } : p
      )
    );
  };

  const setDataAccess = (moduleKey, value) => {
    setPermissions((prev) =>
      prev.map((p) => (p.module === moduleKey ? { ...p, dataAccess: value } : p))
    );
  };

  const handleEdit = (role) => {
    if (role.isSystem) {
      showToast("System roles cannot be edited", "error");
      return;
    }
    setEditingId(role._id);
    setName(role.name);
    setDescription(role.description || "");
    const merged = modules.map((m) => {
      const existing = role.permissions?.find((p) => p.module === m.key);
      return existing || emptyPermission(m.key);
    });
    setPermissions(merged);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPermissions(initPermissions(modules));
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name, description, permissions };
      if (editingId) {
        await axios.put(`/roles/${editingId}`, payload);
        showToast("Role updated successfully");
      } else {
        await axios.post("/roles", payload);
        showToast("Role created successfully");
      }
      resetForm();
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to save role", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, isSystem) => {
    if (isSystem) {
      showToast("System roles cannot be deleted", "error");
      return;
    }
    if (!window.confirm("Delete this role?")) return;
    try {
      await axios.delete(`/roles/${id}`);
      showToast("Role deleted");
      if (editingId === id) resetForm();
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to delete role", "error");
    }
  };

  const moduleLabel = (key) => modules.find((m) => m.key === key)?.label || key;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 999,
          padding: "12px 20px", borderRadius: "var(--radius)",
          background: toast.type === "error" ? "var(--red-soft)" : "var(--green-soft)",
          border: `1px solid ${toast.type === "error" ? "var(--red)" : "var(--green)"}`,
          color: toast.type === "error" ? "var(--red)" : "var(--green)",
          fontSize: 13, fontWeight: 500,
        }}>
          {toast.type === "error" ? "✗ " : "✓ "}{toast.msg}
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 22, color: "var(--text-primary)", margin: 0 }}>
          Role Management
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          Define roles with module-level CRUD permissions and data access scope
        </p>
      </div>

      {(canCreate || (canUpdate && editingId)) && (
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "22px 24px", marginBottom: 20,
        }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)", margin: "0 0 16px" }}>
            {editingId ? "Edit Role" : "Create Role"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <input style={inputStyle} placeholder="Role name *" value={name} onChange={(e) => setName(e.target.value)} />
            <input style={inputStyle} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--bg-elevated)" }}>
                  {["Module", "Create", "Read", "Update", "Delete", "Data Access"].map((h) => (
                    <th key={h} style={{
                      padding: "10px 12px", textAlign: "left", fontSize: 11,
                      color: "var(--text-muted)", textTransform: "uppercase",
                      letterSpacing: "0.6px", borderBottom: "1px solid var(--border)",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm) => (
                  <tr key={perm.module} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 12px", color: "var(--text-primary)", fontWeight: 500 }}>
                      {moduleLabel(perm.module)}
                    </td>
                    {["create", "read", "update", "delete"].map((action) => (
                      <td key={action} style={{ padding: "10px 12px" }}>
                        <input
                          type="checkbox"
                          checked={perm[action]}
                          onChange={() => togglePerm(perm.module, action)}
                        />
                      </td>
                    ))}
                    <td style={{ padding: "10px 12px" }}>
                      <select
                        value={perm.dataAccess}
                        onChange={(e) => setDataAccess(perm.module, e.target.value)}
                        style={{ ...inputStyle, width: "auto", padding: "6px 10px", fontSize: 12 }}
                      >
                        <option value="own">Own Data</option>
                        <option value="all">All Data</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
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
              {saving ? "Saving…" : editingId ? "Update Role" : "Create Role"}
            </button>
            {editingId && (
              <button onClick={resetForm} style={{
                padding: "9px 16px", borderRadius: "var(--radius)",
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                color: "var(--text-secondary)", fontWeight: 500, fontSize: 13,
              }}>Cancel</button>
            )}
          </div>
        </div>
      )}

      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", overflow: "hidden",
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
            All Roles
            <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", background: "var(--bg-elevated)", borderRadius: 99, color: "var(--text-muted)" }}>
              {roles.length}
            </span>
          </span>
        </div>
        {roles.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No roles found.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-elevated)" }}>
                {["Name", "Description", "Type", ""].map((h) => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: "left", fontSize: 11,
                    color: "var(--text-muted)", textTransform: "uppercase",
                    letterSpacing: "0.7px", borderBottom: "1px solid var(--border)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role._id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                    {role.name}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)" }}>
                    {role.description || "—"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12 }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 99, fontSize: 11,
                      background: role.isSystem ? "var(--accent-soft)" : "var(--bg-elevated)",
                      color: role.isSystem ? "var(--accent)" : "var(--text-muted)",
                    }}>
                      {role.isSystem ? "System" : "Custom"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {canUpdate && !role.isSystem && (
                        <button onClick={() => handleEdit(role)} style={{
                          padding: "5px 12px", borderRadius: 6,
                          background: "var(--accent-soft)", border: "1px solid var(--accent)22",
                          color: "var(--accent)", fontSize: 12, fontWeight: 500,
                        }}>Edit</button>
                      )}
                      {canDelete && !role.isSystem && (
                        <button onClick={() => handleDelete(role._id, role.isSystem)} style={{
                          padding: "5px 12px", borderRadius: 6,
                          background: "var(--red-soft)", border: "1px solid var(--red)22",
                          color: "var(--red)", fontSize: 12, fontWeight: 500,
                        }}>Delete</button>
                      )}
                    </div>
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

export default Roles;
