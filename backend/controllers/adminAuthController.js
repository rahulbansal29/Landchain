import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

// ✅ Admin password login (checks DB for admin user)
export const adminLogin = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    // find one admin user
    const admin = await User.findOne({ role: 'admin' });
    if (!admin || !admin.password) {
      return res.status(401).json({ error: 'No admin user configured' });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    const token = jwt.sign(
      { type: "admin_session", wallet: admin.walletAddress },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({ success: true, token, wallet: admin.walletAddress });
  } catch (err) {
    console.error("adminLogin error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ✅ Verify admin session
export const verifyAdminSession = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No admin session token" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.type !== "admin_session") {
      return res.status(401).json({ error: "Invalid session type" });
    }

    return res.json({ valid: true, wallet: decoded.wallet });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired admin session" });
  }
};
