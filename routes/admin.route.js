/**
 * Admin Routes
 */

import express from "express";
import adminController from "../controllers/admin.controller.js";
import notificationController from "../controllers/notification.controller.js";
import reportsController from "../controllers/reports.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// User management (Accessible by Admin, Doctor, and Staff)
router.get("/users", protect, requireRole("admin", "doctor", "staff"), adminController.getAllUsers);
router.get("/users/:userId", protect, requireRole("admin", "doctor", "staff"), adminController.getUserById);

// Specific management actions accessible by Admin and Doctor
router.patch("/users/:userId/status", protect, requireRole("admin", "doctor"), adminController.updateUserStatus);
router.patch("/users/:userId", protect, requireRole("admin", "doctor"), adminController.updateUser);
router.delete("/users/:userId", protect, requireRole("admin", "doctor"), adminController.deleteUser);

// Strict Admin-only routes
router.use(protect, requireRole("admin"));

router.get("/notifications", notificationController.getAllNotifications);
router.post("/notifications/broadcast", notificationController.sendBroadcast);

// Doctor management
router.post("/doctors", adminController.createDoctor);

// Staff management
router.post("/staff", adminController.createStaff);

// Statistics & Reports
router.get("/stats", adminController.getStats);
router.get("/reports", reportsController.getAdminReports);

export default router;
