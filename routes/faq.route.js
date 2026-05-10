import express from "express";
import faqController from "../controllers/faq.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public route to get FAQs
router.get("/", faqController.getAllFAQs);

// Protected routes for Admin
router.post("/", protect, requireRole("admin"), faqController.createFAQ);
router.patch("/:faqId", protect, requireRole("admin"), faqController.updateFAQ);
router.delete("/:faqId", protect, requireRole("admin"), faqController.deleteFAQ);

export default router;
