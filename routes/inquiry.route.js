import express from "express";
import inquiryController from "../controllers/inquiry.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public route to submit inquiry
router.post("/submit", inquiryController.submitInquiry);

// Protected routes for Admin to manage inquiries
router.get("/", protect, requireRole("admin"), inquiryController.getAllInquiries);
router.patch("/:inquiryId/status", protect, requireRole("admin"), inquiryController.updateInquiryStatus);

export default router;
