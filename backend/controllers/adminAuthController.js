import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"; // Change this in production!

// ✅ Admin password login
export const adminLogin = async (req, res) => {
  try {
    const { password } = req.body;

    console.log("Admin login attempt");
    console.log("Received password:", password);
    console.log("Expected password:", ADMIN_PASSWORD);

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    if (password !== ADMIN_PASSWORD) {
      console.log("Password mismatch!");
      return res.status(401).json({ error: "Invalid admin password" });
    }

    console.log("Password matched! Generating token...");

    // Generate admin session token (valid for 8 hours)
    const token = jwt.sign(
      { type: "admin_session", timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    console.log("Token generated successfully");

    return res.json({
      success: true,
      token,
      message: "Admin authenticated successfully",
    });
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

    return res.json({
      valid: true,
      message: "Admin session is valid",
    });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired admin session" });
  }
};
