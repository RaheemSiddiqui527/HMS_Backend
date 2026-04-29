/**
 * Notification Model
 */

import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    notificationId: {
      type: String,
      unique: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for broadcasts
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for system notifications
    },
    recipientRole: {
      type: String,
      enum: ["all", "patient", "doctor", "admin", "staff", null],
      default: null,
    },
    isBroadcast: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
    },
    type: {
      type: String,
      enum: ["normal", "urgent", "reminder", "appointment", "prescription", "broadcast", "medical"],
      default: "normal",
    },
    relatedEntity: {
      type: String,
      enum: ["appointment", "prescription", "user_action"],
      default: null,
    },
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  },
  { timestamps: true }
);

// Auto-generate notificationId
notificationSchema.pre("save", async function () {
  if (!this.notificationId) {
    const count = await this.constructor.countDocuments();
    this.notificationId = `NOT-${Date.now()}-${count + 1}`;
  }
});

// Indexes for common queries
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // TTL index

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
