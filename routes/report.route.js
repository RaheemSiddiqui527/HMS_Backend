/**
 * Report & Analytics Routes
 */

import express from "express";
import reportController from "../controllers/report.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All report routes require authentication and admin role
router.use(protect, requireRole("admin"));

// Dashboard and statistics
router.get("/dashboard/stats", reportController.getDashboardStats);
router.get("/activity/recent", reportController.getRecentActivity);

// Metrics
router.get("/metrics/appointments", reportController.getAppointmentMetrics);
router.get("/metrics/doctors", reportController.getDoctorMetrics);
router.get("/metrics/patients", reportController.getPatientMetrics);
router.get("/metrics/revenue", reportController.getRevenueMetrics);

// Comprehensive report
router.get("/generate", reportController.generateReport);

export default router;
