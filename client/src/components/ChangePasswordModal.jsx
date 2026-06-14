import { useState } from "react";
import axios from "../api/axiosInstance";

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "var(--radius)",
  border: "1px solid var(--border)",
  background: "var(--bg-base)",
  color: "var(--text-primary)",
  fontSize: 13,
  outline: "none",
};

const ChangePasswordModal = ({ onClose }) => {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (form.currentPassword === form.newPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);
    try {
      await axios.post("/auth/change-password", form);
      setSuccess("Password changed successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 400,
          background: "var(--bg-surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)", padding: "24px 28px",
          boxShadow: "0 16px 48px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
            Change Password
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: "var(--text-muted)",
              fontSize: 18, lineHeight: 1, padding: 4, cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { name: "currentPassword", label: "Current Password" },
            { name: "newPassword", label: "New Password" },
            { name: "confirmPassword", label: "Confirm New Password" },
          ].map(({ name, label }) => (
            <div key={name}>
              <label style={{ display: "block", fontSize: 12, color: "var(--text-secondary)", marginBottom: 6 }}>
                {label}
              </label>
              <input
                type="password"
                name={name}
                value={form[name]}
                onChange={handleChange}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>
          ))}

          {error && (
            <div style={{
              padding: "8px 12px", borderRadius: "var(--radius)",
              background: "var(--red-soft)", color: "var(--red)", fontSize: 12,
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              padding: "8px 12px", borderRadius: "var(--radius)",
              background: "var(--green-soft)", color: "var(--green)", fontSize: 12,
            }}>
              {success}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: "10px 0", borderRadius: "var(--radius)",
                border: "1px solid var(--border)", background: "var(--bg-elevated)",
                color: "var(--text-secondary)", fontSize: 13, fontWeight: 500,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, padding: "10px 0", borderRadius: "var(--radius)",
                border: "none", background: loading ? "var(--bg-elevated)" : "var(--accent)",
                color: "white", fontSize: 13, fontWeight: 600,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Saving…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
