import express from "express";
import { createProperty, getAllProperties, getPropertyById, deleteProperty } from "../controllers/propertyController.js";
import { requireAdminKey } from "../middleware/requireAdminKey.js";

const router = express.Router();

// Public routes
router.get("/", getAllProperties);
router.get("/:id", getPropertyById);

// Admin routes
router.post("/", requireAdminKey, createProperty);
router.delete("/:id", requireAdminKey, deleteProperty);

export default router;
