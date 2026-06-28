import { useState, useEffect } from "react";
import { Users as UsersIcon } from "lucide-react";
import axios from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import ConfirmButton from "../components/ConfirmButton";
import LlmAssignPicker from "../components/LlmAssignPicker";
import Input from "../components/Input";
import Button from "../components/Button";

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", color: "var(--text-primary)",
  fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
  transition: "border-color 0.15s",
};

const focusOn = (e) => (e.target.style.borderColor = "var(--accent)");
const focusOff = (e) => (e.target.style.borderColor = "var(--border)");

const roleBadgeColor = (roleName = "") => {
  const r = roleName.toLowerCase();
  if (r.includes("admin")) return "accent";
  if (r.includes("analyst") || r.includes("ba")) return "green";
  if (r.includes("manager") || r.includes("lead")) return "purple";
  return "muted";
};

const llmSummary = (userLlms = [], roleLlms = []) => {
  if (userLlms.length > 0) return `${userLlms.length} custom`;
  if (roleLlms.length > 0) return `${roleLlms.length} from role`;
  return "All models";
};

const filterCatalogForRole = (catalog = [], role) => {
  const roleLlms = role?.allowedLlms || [];
  if (roleLlms.length === 0) return catalog;
  const allowed = new Set(roleLlms);
  return catalog.filter((model) => allowed.has(model.id));
};

const Avatar = ({ first, last }) => {
  const initials = `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase() || "U";
  return (
    <span style={{
      width: 28, height: 28, borderRadius: 99, flexShrink: 0,
      background: "var(--accent)", color: "white",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700,
    }}>
      {initials}
    </span>
  );
};

const Users = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [allowedLlms, setAllowedLlms] = useState([]);
  const [llmCatalog, setLlmCatalog] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission("users", "create");
  const canUpdate = hasPermission("users", "update");
  const canDelete = hasPermission("users", "delete");

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes, catalogRes] = await Promise.all([
        axios.get("/users"),
        axios.get("/roles"),
        axios.get("/users/llm-catalog"),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setLlmCatalog(catalogRes.data?.models || []);
      if (!roleId && rolesRes.data.length > 0) setRoleId(rolesRes.data[0]._id);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to load users", "error");
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setAllowedLlms([]);
    if (roles.length > 0) setRoleId(roles[0]._id);
  };

  const selectedRole = roles.find((r) => r._id === roleId);
  const roleScopedCatalog = filterCatalogForRole(llmCatalog, selectedRole);

  const handleRoleChange = (nextRoleId) => {
    setRoleId(nextRoleId);
    const nextRole = roles.find((r) => r._id === nextRoleId);
    const scoped = filterCatalogForRole(llmCatalog, nextRole);
    const scopedIds = new Set(scoped.map((m) => m.id));
    setAllowedLlms((prev) => prev.filter((id) => scopedIds.has(id)));
  };

  const handleEdit = (u) => {
    setEditingId(u._id);
    setFirstName(u.firstName);
    setLastName(u.lastName || "");
    setEmail(u.email);
    setPassword("");
    setRoleId(u.role?._id || u.role || "");
    setAllowedLlms(u.allowedLlms || []);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !email.trim()) return;
    if (!editingId && (!password || !roleId)) return;

    setSaving(true);
    try {
      const payload = { firstName, lastName, email, roleId, allowedLlms };
      if (password) payload.password = password;

      if (editingId) {
        await axios.put(`/users/${editingId}`, payload);
        showToast("User updated successfully");
      } else {
        await axios.post("/users", { ...payload, password });
        showToast("User created successfully");
      }
      resetForm();
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to save user", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/users/${id}`);
      showToast("User deleted");
      if (editingId === id) resetForm();
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to delete user", "error");
    }
  };

  const toggleActive = async (u) => {
    try {
      await axios.put(`/users/${u._id}`, { isActive: !u.isActive });
      showToast(u.isActive ? "User deactivated" : "User activated");
      fetchData();
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to update user", "error");
    }
  };

  return (
    <div className="ba-page" style={{ maxWidth: 960, margin: "0 auto" }}>
      <PageHeader
        title="User Management"
        subtitle="Create users, assign roles, and optionally restrict AI models per user"
      />

      {(canCreate || (canUpdate && editingId)) && (
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "22px 24px", marginBottom: 20,
        }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text-primary)", margin: "0 0 16px" }}>
            {editingId ? "Edit User" : "Create User"}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2.5">
            <Input label="First name *" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Input label="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input
              label={editingId ? "Password (leave blank to keep)" : "Password *"}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>Role *</label>
              <select
                style={{ ...inputStyle, cursor: "pointer" }}
                value={roleId}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1", marginTop: 4 }}>
              <LlmAssignPicker
                models={roleScopedCatalog}
                selectedIds={allowedLlms}
                onChange={setAllowedLlms}
                emptyLabel="Inherit models from the selected role"
                hint={
                  selectedRole?.allowedLlms?.length
                    ? `Role "${selectedRole.name}" allows ${selectedRole.allowedLlms.length} model(s). Leave empty to grant all of them.`
                    : "Selected role allows all configured models. Pick specific models here to restrict this user further."
                }
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleSubmit}
              disabled={saving || !firstName.trim() || !email.trim() || (!editingId && !password)}
              loading={saving}
            >
              {saving ? "Saving…" : editingId ? "Update user" : "Create user"}
            </Button>
            {editingId && (
              <Button variant="secondary" onClick={resetForm}>Cancel</Button>
            )}
          </div>
        </div>
      )}

      <div style={{
        background: "var(--bg-surface)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)", overflow: "hidden",
      }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>All Users</span>
          <span style={{ fontSize: 11, padding: "2px 8px", background: "var(--bg-elevated)", borderRadius: 99, color: "var(--text-muted)" }}>
            {users.length}
          </span>
        </div>
        {users.length === 0 ? (
          <EmptyState icon={<UsersIcon size={20} strokeWidth={1.75} />} message="No users found" hint="Create a user above to get started." />
        ) : (
          <table className="ba-table">
            <thead>
              <tr>
                {["User", "Email", "Role", "AI Models", "Status", ""].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar first={u.firstName} last={u.lastName} />
                      <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                        {u.firstName} {u.lastName}
                      </span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{u.email}</td>
                  <td>
                    {u.role?.name ? <Badge color={roleBadgeColor(u.role.name)}>{u.role.name}</Badge> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td style={{ fontSize: 12 }}>
                    {llmSummary(u.allowedLlms, u.role?.allowedLlms)}
                  </td>
                  <td>
                    <span
                      title={u.isActive ? "Active" : "Inactive"}
                      style={{
                        display: "inline-block", width: 8, height: 8, borderRadius: 99,
                        background: u.isActive ? "var(--green)" : "var(--red)",
                        boxShadow: u.isActive ? "0 0 6px var(--green)" : "none",
                      }}
                    />
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      {canUpdate && (
                        <>
                          <button onClick={() => handleEdit(u)} style={{
                            padding: "5px 12px", borderRadius: 6,
                            background: "var(--accent-soft)", border: "1px solid var(--accent)22",
                            color: "var(--accent)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                          }}>Edit</button>
                          {u._id !== currentUser?._id && (
                            <button onClick={() => toggleActive(u)} style={{
                              padding: "5px 12px", borderRadius: 6,
                              background: "var(--bg-elevated)", border: "1px solid var(--border)",
                              color: "var(--text-secondary)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                            }}>{u.isActive ? "Deactivate" : "Activate"}</button>
                          )}
                        </>
                      )}
                      {canDelete && u._id !== currentUser?._id && (
                        <ConfirmButton onConfirm={() => handleDelete(u._id)} />
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

export default Users;
