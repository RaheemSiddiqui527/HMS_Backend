/**
 * Medical Record Routes
 */

import express from "express";
import medicalRecordController from "../controllers/medicalRecord.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Doctor only - add medical record
router.post("/add", protect, requireRole("doctor"), medicalRecordController.addMedicalRecord);

// Protected routes
router.get("/list", protect, medicalRecordController.getMedicalRecords);
router.get("/history/:patientId", protect, medicalRecordController.getPatientMedicalHistory);
router.get("/:recordId", protect, medicalRecordController.getMedicalRecordById);

// Doctor/Admin only - update/delete
router.patch("/:recordId", protect, requireRole("doctor", "admin"), medicalRecordController.updateRecord);
router.delete("/:recordId", protect, requireRole("doctor", "admin"), medicalRecordController.deleteRecord);

export default router;
