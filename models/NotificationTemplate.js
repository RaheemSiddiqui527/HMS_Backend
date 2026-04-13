/**
 * Notification Template Model
 */

import mongoose from "mongoose";

const notificationTemplateSchema = new mongoose.Schema(
  {
    templateId: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      required: [true, "Template name is required"],
    },
    content: {
      type: String,
      required: [true, "Template content is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Auto-generate templateId
notificationTemplateSchema.pre("save", async function (next) {
  if (!this.templateId) {
    const count = await NotificationTemplate.countDocuments();
    this.templateId = `TMPL-${Date.now()}-${count + 1}`;
  }
  next();
});

// Indexes for common queries
notificationTemplateSchema.index({ createdBy: 1 });
notificationTemplateSchema.index({ isActive: 1 });

const NotificationTemplate = mongoose.model("NotificationTemplate", notificationTemplateSchema);

export default NotificationTemplate;
