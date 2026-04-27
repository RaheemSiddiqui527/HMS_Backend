import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    deviceInfo: {
      browser: String,
      os: String,
      device: String,
    },
    ipAddress: {
      type: String,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "revoked"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Index for performance
sessionSchema.index({ userId: 1 });
sessionSchema.index({ token: 1 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;
