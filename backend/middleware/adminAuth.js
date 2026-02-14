export function adminAuth(req, res) {
  return res.status(410).json({
    error: "Deprecated admin auth. Use wallet login + JWT.",
  });
}
