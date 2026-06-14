import { useState, useEffect } from "react";
import axios from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--bg-elevated)", border: "1px solid var(--border)",
  borderRadius: "var(--radius)", color: "var(--text-primary)",
  fontSize: 13, outline: "none", fontFamily: "inherit", boxSizing: "border-box",
};

const Users = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);

  const canCreate = hasPermission("users", "create");
  const canUpdate = hasPermission("users", "update");
  const canDelete = hasPermission("users", "delete");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        axios.get("/users"),
        axios.get("/roles"),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      if (!roleId && rolesRes.data.length > 0) {
        setRoleId(rolesRes.data[0]._id);
      }
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
    if (!window.confirm("Delete this user?")) return;
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
          User Management
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>
          Create users and assign roles with defined permissions
        </p>
      </div>

      {(canCreate || (canUpdate && editingId)) && (
        <div style={{
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "22px 24px", marginBottom: 20,
        }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)", margin: "0 0 16px" }}>
            {editingId ? "Edit User" : "Create User"}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>First Name *</label>
              <input style={inputStyle} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>Last Name</label>
              <input style={inputStyle} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>Email *</label>
              <input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>
                Password {editingId ? "(leave blank to keep)" : "*"}
              </label>
              <input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4, display: "block" }}>Role *</label>
              <select style={inputStyle} value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
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
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>
            All Users
            <span style={{ marginLeft: 8, fontSize: 11, padding: "2px 8px", background: "var(--bg-elevated)", borderRadius: 99, color: "var(--text-muted)" }}>
              {users.length}
            </span>
          </span>
        </div>
        {users.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
            No users found.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-elevated)" }}>
                {["Name", "Email", "Role", "Status", ""].map((h) => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: "left", fontSize: 11,
                    color: "var(--text-muted)", textTransform: "uppercase",
                    letterSpacing: "0.7px", borderBottom: "1px solid var(--border)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 500, color: "var(--text-primary)" }}>
                    {u.firstName} {u.lastName}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)" }}>{u.email}</td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-secondary)" }}>
                    {u.role?.name || "—"}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 99, fontSize: 11,
                      background: u.isActive ? "var(--green-soft)" : "var(--red-soft)",
                      color: u.isActive ? "var(--green)" : "var(--red)",
                    }}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      {canUpdate && (
                        <>
                          <button onClick={() => handleEdit(u)} style={{
                            padding: "5px 12px", borderRadius: 6,
                            background: "var(--accent-soft)", border: "1px solid var(--accent)22",
                            color: "var(--accent)", fontSize: 12, fontWeight: 500,
                          }}>Edit</button>
                          {u._id !== currentUser?._id && (
                            <button onClick={() => toggleActive(u)} style={{
                              padding: "5px 12px", borderRadius: 6,
                              background: "var(--bg-elevated)", border: "1px solid var(--border)",
                              color: "var(--text-secondary)", fontSize: 12, fontWeight: 500,
                            }}>{u.isActive ? "Deactivate" : "Activate"}</button>
                          )}
                        </>
                      )}
                      {canDelete && u._id !== currentUser?._id && (
                        <button onClick={() => handleDelete(u._id)} style={{
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

export default Users;
