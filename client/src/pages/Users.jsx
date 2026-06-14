import { useState, useEffect } from "react";
import axios from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import Badge from "../components/Badge";
import EmptyState from "../components/EmptyState";
import ConfirmButton from "../components/ConfirmButton";

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

const UsersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const Avatar = ({ first, last }) => {
  const initials = `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase() || "U";
  return (
    <span style={{
      width: 28, height: 28, borderRadius: 99, flexShrink: 0,
      background: "var(--header-gradient)", color: "white",
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
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission("users", "create");
  const canUpdate = hasPermission("users", "update");
  const canDelete = hasPermission("users", "delete");

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        axios.get("/users"),
        axios.get("/roles"),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
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
    if (roles.length > 0) setRoleId(roles[0]._id);
  };

  const handleEdit = (u) => {
    setEditingId(u._id);
    setFirstName(u.firstName);
    setLastName(u.lastName || "");
    setEmail(u.email);
    setPassword("");
    setRoleId(u.role?._id || u.role || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !email.trim()) return;
    if (!editingId && (!password || !roleId)) return;

    setSaving(true);
    try {
      const payload = { firstName, lastName, email, roleId };
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
        subtitle="Create users and assign roles with defined permissions"
      />

      {(canCreate || (canUpdate && editingId)) && (
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "22px 24px", marginBottom: 20,
        }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 15, color: "var(--text-primary)", margin: "0 0 16px" }}>
            {editingId ? "Edit User" : "Create User"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>First Name *</label>
              <input style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>Last Name</label>
              <input style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>Email *</label>
              <input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>
                Password {editingId ? "(leave blank to keep)" : "*"}
              </label>
              <input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} onFocus={focusOn} onBlur={focusOff} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>Role *</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              onClick={handleSubmit}
              disabled={saving || !firstName.trim() || !email.trim() || (!editingId && !password)}
              style={{
                padding: "9px 20px", borderRadius: "var(--radius)",
                background: "var(--accent)", border: "none", color: "white",
                fontWeight: 600, fontSize: 13,
                opacity: (saving || !firstName.trim() || !email.trim() || (!editingId && !password)) ? 0.5 : 1,
                cursor: (saving || !firstName.trim() || !email.trim() || (!editingId && !password)) ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving…" : editingId ? "Update User" : "Create User"}
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
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>All Users</span>
          <span style={{ fontSize: 11, padding: "2px 8px", background: "var(--bg-elevated)", borderRadius: 99, color: "var(--text-muted)" }}>
            {users.length}
          </span>
        </div>
        {users.length === 0 ? (
          <EmptyState icon={<UsersIcon />} message="No users found" hint="Create a user above to get started." />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-elevated)" }}>
                {["User", "Email", "Role", "Status", ""].map((h) => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: "left", fontSize: 11,
                    color: "var(--text-muted)", textTransform: "uppercase",
                    letterSpacing: "0.7px", borderBottom: "1px solid var(--border)", fontWeight: 600,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u._id} style={{ borderBottom: "1px solid var(--border)", background: idx % 2 === 1 ? "var(--bg-elevated)" : "transparent" }}>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar first={u.firstName} last={u.lastName} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                        {u.firstName} {u.lastName}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 16px", fontSize: 12, color: "var(--text-secondary)" }}>{u.email}</td>
                  <td style={{ padding: "10px 16px" }}>
                    {u.role?.name ? <Badge color={roleBadgeColor(u.role.name)}>{u.role.name}</Badge> : <span style={{ color: "var(--text-muted)" }}>—</span>}
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span
                      title={u.isActive ? "Active" : "Inactive"}
                      style={{
                        display: "inline-block", width: 8, height: 8, borderRadius: 99,
                        background: u.isActive ? "var(--green)" : "var(--red)",
                        boxShadow: u.isActive ? "0 0 6px var(--green)" : "none",
                      }}
                    />
                  </td>
                  <td style={{ padding: "10px 16px" }}>
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
