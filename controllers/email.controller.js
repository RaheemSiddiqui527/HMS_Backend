/**
 * Email Controller — Admin Email Log Management + Custom Notifications
 */

import EmailLog from "../models/EmailLog.js";
import User from "../models/User.js";
import notifyService from "../utils/notifyService.js";
import { sendSuccess, sendError } from "../utils/response.js";

// GET /api/v1/email/logs — All logs with filters
const getEmailLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, type, userId } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (userId) filter.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await EmailLog.find(filter)
      .populate("userId", "firstName lastName email role")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await EmailLog.countDocuments(filter);

    return sendSuccess(
      res,
      {
        logs,
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      },
      "Email logs retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/email/logs/:logId — Single log detail
const getEmailLogById = async (req, res, next) => {
  try {
    const { logId } = req.params;

    const log = await EmailLog.findById(logId).populate(
      "userId",
      "firstName lastName email role"
    );

    if (!log) {
      return sendError(res, "Email log not found", 404);
    }

    return sendSuccess(res, log, "Email log retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/email/stats — Aggregate stats for admin dashboard
const getEmailStats = async (req, res, next) => {
  try {
    const totalSent = await EmailLog.countDocuments({ status: "sent" });
    const totalFailed = await EmailLog.countDocuments({ status: "failed" });
    const total = await EmailLog.countDocuments();

    // Break down by type
    const byType = await EmailLog.aggregate([
      {
        $group: {
          _id: "$type",
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          avgDurationMs: { $avg: "$durationMs" },
        },
      },
      { $sort: { total: -1 } },
    ]);

    // Last 7 days daily breakdown
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyStats = await EmailLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          total: { $sum: 1 },
          sent: { $sum: { $cond: [{ $eq: ["$status", "sent"] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Recent failures
    const recentFailures = await EmailLog.find({ status: "failed" })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(5);

    return sendSuccess(
      res,
      {
        summary: {
          total,
          totalSent,
          totalFailed,
          successRate:
            total > 0 ? ((totalSent / total) * 100).toFixed(1) + "%" : "N/A",
        },
        byType,
        dailyStats,
        recentFailures,
      },
      "Email statistics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/email/logs/:logId — Delete a specific log
const deleteEmailLog = async (req, res, next) => {
  try {
    const { logId } = req.params;

    const log = await EmailLog.findByIdAndDelete(logId);
    if (!log) {
      return sendError(res, "Email log not found", 404);
    }

    return sendSuccess(res, null, "Email log deleted successfully");
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v1/email/logs — Bulk delete old logs (older than N days)
const purgeOldLogs = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const cutoff = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

    const result = await EmailLog.deleteMany({ createdAt: { $lt: cutoff } });

    return sendSuccess(
      res,
      { deletedCount: result.deletedCount },
      `Purged ${result.deletedCount} email logs older than ${days} days`
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/email/notify
 * Admin or Doctor sends a custom / festive email + in-app notification
 *
 * Body:
 *  templateType  : "birthday" | "eid_fitr" | "eid_adha" | "custom"  (required)
 *  recipientType : "user" | "role" | "all"                           (required)
 *  userId        : ObjectId   — required when recipientType = "user"
 *  role          : string     — required when recipientType = "role" (patient|doctor|staff|admin)
 *  customMessage : string     — optional personal note (shown in all templates)
 *  senderName    : string     — sender display name
 *  // For "custom" template only:
 *  subject, title, message, badgeText, badgeColor, emoji, ctaText, ctaUrl
 */
const sendCustomNotification = async (req, res, next) => {
  try {
    const {
      templateType,
      recipientType,
      userId,
      role,
      customMessage,
      senderName,
      senderRole,
      subject,
      title,
      message,
      badgeText,
      badgeColor,
      emoji,
      ctaText,
      ctaUrl,
    } = req.body;

    // ── Validation ────────────────────────────────
    const validTemplates = ["birthday", "eid_fitr", "eid_adha", "ramadan", "jumma", "islamic_new_year", "custom"];
    if (!templateType || !validTemplates.includes(templateType)) {
      return sendError(
        res,
        `Invalid templateType. Must be one of: ${validTemplates.join(", ")}`,
        400
      );
    }

    if (!recipientType || !["user", "role", "all"].includes(recipientType)) {
      return sendError(res, "recipientType must be 'user', 'role', or 'all'", 400);
    }

    if (templateType === "custom" && !message && !customMessage) {
      return sendError(res, "message is required for custom template", 400);
    }

    // ── Find Recipients ───────────────────────────
    let users = [];

    if (recipientType === "user") {
      if (!userId) return sendError(res, "userId is required when recipientType is 'user'", 400);
      const user = await User.findById(userId).select("firstName lastName email _id role");
      if (!user) return sendError(res, "User not found", 404);
      users = [user];

    } else if (recipientType === "role") {
      const validRoles = ["patient", "doctor", "staff", "admin"];
      if (!role || !validRoles.includes(role)) {
        return sendError(res, `role must be one of: ${validRoles.join(", ")}`, 400);
      }
      users = await User.find({ role, status: "active" }).select("firstName lastName email _id role");
      if (!users.length) return sendError(res, `No active ${role}s found`, 404);

    } else if (recipientType === "all") {
      users = await User.find({ status: "active" }).select("firstName lastName email _id role");
      if (!users.length) return sendError(res, "No active users found", 404);
    }

    // ── Build sender info ─────────────────────────
    const sender = await User.findById(req.user.id).select("firstName lastName role");
    const resolvedSenderName = senderName || `${sender?.firstName || ""} ${sender?.lastName || ""}`.trim() || "SDI Health Care Team";
    const resolvedSenderRole = senderRole || (sender?.role === "doctor" ? "Doctor" : "Administrator");

    // ── Dispatch (non-blocking — returns stats) ───
    const result = await notifyService.notifyCustom(users, {
      templateType,
      senderName: resolvedSenderName,
      senderRole: resolvedSenderRole,
      customMessage,
      eidType: templateType === "eid_adha" ? "Eid ul-Adha" : "Eid ul-Fitr",
      subject,
      title,
      message,
      badgeText,
      badgeColor,
      emoji,
      ctaText,
      ctaUrl,
    });

    return sendSuccess(
      res,
      {
        templateType,
        recipientType,
        recipientCount: users.length,
        emailsSent: Math.floor(result.sent / 2), // 2 tasks per user (email + notif)
        notificationsSent: Math.floor(result.sent / 2),
        failed: result.failed,
      },
      `Custom notification sent to ${users.length} recipient(s) successfully`
    );
  } catch (error) {
    next(error);
  }
};

export default {
  getEmailLogs,
  getEmailLogById,
  getEmailStats,
  deleteEmailLog,
  purgeOldLogs,
  sendCustomNotification,
};
