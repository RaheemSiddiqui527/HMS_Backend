/**
 * Admin Routes
 */

import express from "express";
import adminController from "../controllers/admin.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(protect, requireRole("admin"));

// User management
router.get("/users", adminController.getAllUsers);
router.get("/users/:userId", adminController.getUserById);
router.patch("/users/:userId/status", adminController.updateUserStatus);
router.delete("/users/:userId", adminController.deleteUser);

// Doctor management
router.post("/doctors", adminController.createDoctor);

// Staff management
router.post("/staff", adminController.createStaff);

// Statistics
router.get("/stats", adminController.getStats);

export default router;
