import jwt from "jsonwebtoken";

const ADMIN_KEY = process.env.ADMIN_KEY || "dev-admin";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

const hasValidAdminSession = (token) => {
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Accept both admin_session (password login) and user_session with admin role (wallet login)
    return decoded?.type === "admin_session" || 
           (decoded?.type === "user_session" && decoded?.role === "admin");
  } catch {
    return false;
  }
};

export const requireAdminKey = (req, res, next) => {
  const key = req.headers["x-admin-key"];
  if (key && key === ADMIN_KEY) {
    return next();
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (hasValidAdminSession(token)) {
    return next();
  }

  return res.status(403).json({ error: "Admin key required" });
};
