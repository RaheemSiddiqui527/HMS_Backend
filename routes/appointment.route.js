/**
 * Appointment Routes
 */

import express from "express";
import appointmentController from "../controllers/appointment.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public route - check availability
router.get("/availability/check", appointmentController.checkAvailability);

// Protected routes
router.post("/book", protect, appointmentController.bookAppointment);
router.get("/list", protect, appointmentController.getAppointments);
router.get("/schedule", protect, appointmentController.getDoctorSchedule);
router.get("/:appointmentId", protect, appointmentController.getAppointmentById);

// Doctor/Admin only - update status
router.patch("/:appointmentId/status", protect, requireRole("doctor", "admin"), appointmentController.updateAppointmentStatus);

// Cancel appointment
router.patch("/:appointmentId/cancel", protect, appointmentController.cancelAppointment);

export default router;
