/**
 * Notification Controller - All functions with default export
 */

import Notification from "../models/Notification.js";
import NotificationTemplate from "../models/NotificationTemplate.js";
import User from "../models/User.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { validate, notificationSchemas } from "../utils/validators.js";
import { NotFoundError } from "../utils/errors.js";

// Send notification
const sendNotification = async (req, res, next) => {
  try {
    const { recipientId, title, message, type = "normal" } = req.body;

    // Validate input
    const { error, value } = validate(notificationSchemas.send, req.body);
    if (error) {
      return sendError(res, "Validation failed", 400, error);
    }

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return sendError(res, "Recipient not found", 404);
    }

    const notification = new Notification({
      recipientId,
      senderId: req.user.id,
      title,
      message,
      type,
      isRead: false,
    });

    await notification.save();

    const populatedNotification = await Notification.findById(notification._id)
      .populate("recipientId")
      .populate("senderId");

    return sendSuccess(res, populatedNotification, "Notification sent successfully", 201);
  } catch (error) {
    next(error);
  }
};

// Get user notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isRead } = req.query;

    const filter = { recipientId: req.user.id };

    if (isRead !== undefined) {
      filter.isRead = isRead === "true";
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const notifications = await Notification.find(filter)
      .populate("senderId")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      recipientId: req.user.id,
      isRead: false,
    });

    return sendSuccess(
      res,
      {
        notifications,
        unreadCount,
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      },
      "Notifications retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      {
        isRead: true,
        readAt: new Date(),
      },
      { new: true }
    )
      .populate("senderId")
      .populate("recipientId");

    if (!notification) {
      return sendError(res, "Notification not found", 404);
    }

    return sendSuccess(res, notification, "Notification marked as read");
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return sendSuccess(
      res,
      { updatedCount: result.modifiedCount },
      "All notifications marked as read"
    );
  } catch (error) {
    next(error);
  }
};

// Delete notification
const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return sendError(res, "Notification not found", 404);
    }

    return sendSuccess(res, null, "Notification deleted successfully");
  } catch (error) {
    next(error);
  }
};

// Create notification template
const createTemplate = async (req, res, next) => {
  try {
    const { name, content } = req.body;

    // Validate input
    const { error, value } = validate(notificationSchemas.createTemplate, req.body);
    if (error) {
      return sendError(res, "Validation failed", 400, error);
    }

    const template = new NotificationTemplate({
      name,
      content,
      createdBy: req.user.id,
      isActive: true,
    });

    await template.save();

    const populatedTemplate = await NotificationTemplate.findById(template._id).populate(
      "createdBy"
    );

    return sendSuccess(res, populatedTemplate, "Template created successfully", 201);
  } catch (error) {
    next(error);
  }
};

// Get notification templates
const getTemplates = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const templates = await NotificationTemplate.find({ createdBy: req.user.id })
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await NotificationTemplate.countDocuments({ createdBy: req.user.id });

    return sendSuccess(
      res,
      {
        templates,
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      },
      "Templates retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get template by ID
const getTemplateById = async (req, res, next) => {
  try {
    const { templateId } = req.params;

    const template = await NotificationTemplate.findById(templateId).populate("createdBy");

    if (!template) {
      return sendError(res, "Template not found", 404);
    }

    return sendSuccess(res, template, "Template retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Update template
const updateTemplate = async (req, res, next) => {
  try {
    const { templateId } = req.params;
    const { name, content, isActive } = req.body;

    const template = await NotificationTemplate.findByIdAndUpdate(
      templateId,
      {
        name,
        content,
        isActive,
      },
      { new: true }
    ).populate("createdBy");

    if (!template) {
      return sendError(res, "Template not found", 404);
    }

    return sendSuccess(res, template, "Template updated successfully");
  } catch (error) {
    next(error);
  }
};

// Delete template
const deleteTemplate = async (req, res, next) => {
  try {
    const { templateId } = req.params;

    const template = await NotificationTemplate.findByIdAndDelete(templateId);

    if (!template) {
      return sendError(res, "Template not found", 404);
    }

    return sendSuccess(res, null, "Template deleted successfully");
  } catch (error) {
    next(error);
  }
};

// Export all functions as default
export default {
  sendNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createTemplate,
  getTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
};
