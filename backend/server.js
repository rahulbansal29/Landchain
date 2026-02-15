// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import kycRoutes from "./routes/KYCRoutes.js";
import tokenRoutes from "./routes/tokenRoutes.js";
import propertyRoutes from "./routes/propertyRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
  })
);
app.use(pinoHttp());

// Health
app.get("/", (req, res) => res.send("LandChain Backend Running ✅"));

// API routes
app.use("/api/kyc", kycRoutes);
app.use("/api/token", tokenRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/admin-auth", adminAuthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin/analytics", analyticsRoutes);

// Error fallback
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3000;

// Global error handlers
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`CORS enabled for all origins`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
