/**
 * User Routes
 */

import express from "express";
import userController from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Protected routes - all require authentication
router.get("/profile", protect, userController.getProfile);
router.patch("/profile", protect, userController.updateProfile);
router.post("/change-password", protect, userController.changePassword);
router.delete("/account", protect, userController.deleteAccount);

// Admin routes
router.get("/:userId", protect, userController.getUserById);

export default router;
