import User from "../models/user.model.mjs";
import { signToken } from "../middleware/auth.middleware.mjs";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .populate("role")
      .select("+password");

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        allowedLlms: user.allowedLlms || [],
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("role");
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      allowedLlms: user.allowedLlms || [],
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All password fields are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ error: "New password must be different from current password" });
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
