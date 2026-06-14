import { useState, useEffect } from "react";
import axios from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import ConfirmButton from "../components/ConfirmButton";
import LlmAssignPicker from "../components/LlmAssignPicker";

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", color: "var(--text-primary)",
  fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  transition: "border-color 0.15s",
};

const focusOn = (e) => (e.target.style.borderColor = "var(--accent)");
const focusOff = (e) => (e.target.style.borderColor = "var(--border)");

const emptyPermission = (module) => ({
  module, create: false, read: false, update: false, delete: false, dataAccess: "own",
});

const ShieldIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const countPerms = (perms = []) =>
  perms.reduce((acc, p) => acc + ["create", "read", "update", "delete"].filter((a) => p[a]).length, 0);

const llmSummary = (allowedLlms = []) =>
  allowedLlms.length === 0 ? "All models" : `${allowedLlms.length} model${allowedLlms.length === 1 ? "" : "s"}`;

const Roles = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();
  const [modules, setModules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [allowedLlms, setAllowedLlms] = useState([]);
  const [llmCatalog, setLlmCatalog] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission("roles", "create");
  const canUpdate = hasPermission("roles", "update");
  const canDelete = hasPermission("roles", "delete");

  const initPermissions = (moduleList) => moduleList.map((m) => emptyPermission(m.key));

  const fetchData = async () => {
    try {
      const [modRes, rolesRes, modelsRes] = await Promise.all([
        axios.get("/roles/modules"),
        axios.get("/roles"),
        axios.get("/roles/llm-catalog"),
      ]);
      setModules(modRes.data);
      setRoles(rolesRes.data);
      setLlmCatalog(modelsRes.data?.models || []);
      if (!editingId && permissions.length === 0) {
        setPermissions(initPermissions(modRes.data));
      }
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to load roles", "error");
    }
  };

  useEffect(() => { fetchData(); }, []);

  const togglePerm = (moduleKey, field) => {
    setPermissions((prev) => prev.map((p) => (p.module === moduleKey ? { ...p, [field]: !p[field] } : p)));
  };

  const setDataAccess = (moduleKey, value) => {
    setPermissions((prev) => prev.map((p) => (p.module === moduleKey ? { ...p, dataAccess: value } : p)));
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
    setAllowedLlms(role.allowedLlms || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setPermissions(initPermissions(modules));
    setAllowedLlms([]);
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name, description, permissions, allowedLlms };
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

  const handleDelete = async (id) => {
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

  const colHead = {
    padding: "8px 12px", textAlign: "left", fontSize: 11,
    color: "var(--text-muted)", textTransform: "uppercase",
    letterSpacing: "0.6px", fontWeight: 600, borderBottom: "1px solid var(--border)",
  };

  return (
    <div className="ba-page" style={{ maxWidth: 960, margin: "0 auto" }}>
      <PageHeader
        title="Role Management"
        subtitle="Define roles with module permissions, data access scope, and allowed AI models"
      />

      {(canCreate || (canUpdate && editingId)) && (
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "22px 24px", marginBottom: 20,
        }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text-primary)", margin: "0 0 16px" }}>
            {editingId ? "Edit Role" : "Create Role"}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            <input style={inputStyle} placeholder="Role name *" value={name} onChange={(e) => setName(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
            <input style={inputStyle} placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
          </div>

          <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "var(--radius)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--bg-elevated)" }}>
                  {["Module", "Create", "Read", "Update", "Delete", "Data Access"].map((h) => (
                    <th key={h} style={colHead}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm, idx) => (
                  <tr key={perm.module} style={{ borderBottom: "1px solid var(--border)", background: idx % 2 === 1 ? "var(--bg-elevated)" : "transparent" }}>
                    <td style={{ padding: "9px 12px", color: "var(--text-primary)", fontWeight: 500 }}>
                      {moduleLabel(perm.module)}
                    </td>
                    {["create", "read", "update", "delete"].map((action) => (
                      <td key={action} style={{ padding: "9px 12px" }}>
                        <input
                          type="checkbox"
                          className="ba-check"
                          checked={perm[action]}
                          onChange={() => togglePerm(perm.module, action)}
                        />
                      </td>
                    ))}
                    <td style={{ padding: "9px 12px" }}>
                      <select
                        value={perm.dataAccess}
                        onChange={(e) => setDataAccess(perm.module, e.target.value)}
                        style={{ ...inputStyle, width: "auto", padding: "6px 10px", fontSize: 12, cursor: "pointer" }}
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

          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
            <LlmAssignPicker
              models={llmCatalog}
              selectedIds={allowedLlms}
              onChange={setAllowedLlms}
              emptyLabel="All configured models are available to users with this role"
              hint="Leave none selected to allow every configured model. Users inherit these models unless overridden on their profile."
            />
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
        borderRadius: "var(--radius-lg)", padding: "18px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
            All Roles
          </span>
          <span style={{ fontSize: 11, padding: "2px 8px", background: "var(--bg-elevated)", borderRadius: 99, color: "var(--text-muted)" }}>
            {roles.length}
          </span>
        </div>

        {roles.length === 0 ? (
          <EmptyState icon={<ShieldIcon />} message="No roles found" hint="Create a role above to define permissions." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {roles.map((role) => (
              <div key={role._id} style={{
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                borderRadius: "var(--radius)", padding: "14px 16px",
                display: "flex", flexDirection: "column", gap: 10,
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
                      {role.name}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                      {countPerms(role.permissions)} permissions · {llmSummary(role.allowedLlms)}
                    </div>
                  </div>
                  <Badge color={role.isSystem ? "accent" : "purple"}>
                    {role.isSystem ? "System" : "Custom"}
                  </Badge>
                </div>
                {role.description && (
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
                    {role.description}
                  </div>
                )}
                {!role.isSystem && (canUpdate || canDelete) && (
                  <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                    {canUpdate && (
                      <button onClick={() => handleEdit(role)} style={{
                        padding: "5px 12px", borderRadius: 6,
                        background: "var(--accent-soft)", border: "1px solid var(--accent)22",
                        color: "var(--accent)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                      }}>Edit</button>
                    )}
                    {canDelete && <ConfirmButton onConfirm={() => handleDelete(role._id)} />}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Roles;
