import { useState } from "react";
import axios from "../api/axiosInstance";
import Modal from "./Modal";
import Input from "./Input";
import Button from "./Button";

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
    <Modal title="Change password" onClose={onClose} maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {[
          { name: "currentPassword", label: "Current password" },
          { name: "newPassword", label: "New password" },
          { name: "confirmPassword", label: "Confirm new password" },
        ].map(({ name, label }) => (
          <Input
            key={name}
            type="password"
            name={name}
            label={label}
            value={form[name]}
            onChange={handleChange}
          />
        ))}

        {error && (
          <div className="px-3 py-2 rounded bg-red-soft text-red text-xs">{error}</div>
        )}
        {success && (
          <div className="px-3 py-2 rounded bg-green-soft text-green text-xs">{success}</div>
        )}

        <div className="flex gap-2.5 mt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={loading} loading={loading} className="flex-1">
            {loading ? "Saving…" : "Update password"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ChangePasswordModal;
