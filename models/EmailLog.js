/**
 * EmailLog Model
 * Stores a full audit trail of every email sent by the system.
 */

import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
  {
    logId: {
      type: String,
      unique: true,
    },
    // Who was the email sent to
    to: {
      type: String,
      required: true,
    },
    // Subject line
    subject: {
      type: String,
      required: true,
    },
    // Email template/event type
    type: {
      type: String,
      enum: [
        "welcome",
        "appointment_booked",
        "appointment_confirmed",
        "appointment_cancelled",
        "prescription",
        "login_alert",
        "custom",
      ],
      required: true,
    },
    // Related user (patient, doctor, etc.)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Related entity (appointment ID, prescription ID, etc.)
    relatedEntityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    // sent | failed
    status: {
      type: String,
      enum: ["sent", "failed"],
      default: "sent",
    },
    // Nodemailer messageId on success
    messageId: {
      type: String,
      default: null,
    },
    // Error message if failed
    error: {
      type: String,
      default: null,
    },
    // How long it took to send (ms)
    durationMs: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-generate logId
emailLogSchema.pre("save", async function () {
  if (!this.logId) {
    const count = await this.constructor.countDocuments();
    this.logId = `EML-${Date.now()}-${count + 1}`;
  }
});

// Indexes for admin queries
emailLogSchema.index({ type: 1, createdAt: -1 });
emailLogSchema.index({ userId: 1, createdAt: -1 });
emailLogSchema.index({ status: 1 });

const EmailLog = mongoose.model("EmailLog", emailLogSchema);

export default EmailLog;
