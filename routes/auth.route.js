import express from "express";
import authController from "../controllers/auth.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected routes
router.post("/logout", protect, authController.logout);
router.post("/verify-token", protect, authController.verifyUserToken);
router.post("/refresh-token", protect, authController.refreshToken);

export default router;
