/**
 * Prescription Routes
 */

import express from "express";
import prescriptionController from "../controllers/prescription.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Protected routes - require authentication
router.post("/create", protect, requireRole("doctor"), prescriptionController.createPrescription);
router.get("/list", protect, prescriptionController.getPrescriptions);
router.get("/history/:patientId", protect, prescriptionController.getPrescriptionHistory);
router.get("/:prescriptionId", protect, prescriptionController.getPrescriptionById);

// Doctor only - update/delete
router.patch("/:prescriptionId", protect, requireRole("doctor"), prescriptionController.updatePrescription);
router.delete("/:prescriptionId", protect, requireRole("doctor"), prescriptionController.deletePrescription);

export default router;
