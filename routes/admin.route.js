/**
 * Admin Routes
 */

import express from "express";
import adminController from "../controllers/admin.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// User management (Accessible by Admin and Doctor for search/referral)
router.get("/users", protect, requireRole("admin", "doctor"), adminController.getAllUsers);
router.get("/users/:userId", protect, requireRole("admin", "doctor"), adminController.getUserById);

// All other admin routes require authentication and admin role strictly
router.use(protect, requireRole("admin"));

router.patch("/users/:userId/status", adminController.updateUserStatus);
router.delete("/users/:userId", adminController.deleteUser);

// Doctor management
router.post("/doctors", adminController.createDoctor);

// Staff management
router.post("/staff", adminController.createStaff);

// Statistics
router.get("/stats", adminController.getStats);

export default router;
