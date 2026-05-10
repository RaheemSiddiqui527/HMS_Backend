/**
 * Email Log Routes — Admin Only (except /notify which also allows doctor)
 */

import express from "express";
import emailController from "../controllers/email.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ── Custom / Festive Notification Sender ───────────────────────────────────
// Admin AND Doctor can send birthday, Eid, or custom messages to users
router.post(
  "/notify",
  protect,
  requireRole("admin", "doctor"),
  emailController.sendCustomNotification
);

// ── Admin-only Email Log Management ───────────────────────────────────────
router.use(protect, requireRole("admin"));

// GET  /api/v1/email/stats         — Dashboard stats
router.get("/stats", emailController.getEmailStats);

// GET  /api/v1/email/logs          — All logs with filters
router.get("/logs", emailController.getEmailLogs);

// GET  /api/v1/email/logs/:logId   — Single log detail
router.get("/logs/:logId", emailController.getEmailLogById);

// DELETE /api/v1/email/logs/:logId — Delete specific log
router.delete("/logs/:logId", emailController.deleteEmailLog);

// DELETE /api/v1/email/purge       — Purge old logs (?days=30)
router.delete("/purge", emailController.purgeOldLogs);

export default router;
