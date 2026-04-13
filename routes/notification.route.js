/**
 * Notification Routes
 */

import express from "express";
import notificationController from "../controllers/notification.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Protected routes - require authentication
router.post("/send", protect, notificationController.sendNotification);
router.get("/list", protect, notificationController.getNotifications);
router.patch("/:notificationId/read", protect, notificationController.markAsRead);
router.patch("/read-all", protect, notificationController.markAllAsRead);
router.delete("/:notificationId", protect, notificationController.deleteNotification);

// Template routes
router.post("/template/create", protect, notificationController.createTemplate);
router.get("/template/list", protect, notificationController.getTemplates);
router.get("/template/:templateId", protect, notificationController.getTemplateById);
router.patch("/template/:templateId", protect, notificationController.updateTemplate);
router.delete("/template/:templateId", protect, notificationController.deleteTemplate);

export default router;
