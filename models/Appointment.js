/**
 * Appointment Model
 */

import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: String,
      unique: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "doctor",
      required: true,
    },
    date: {
      type: Date,
      required: [true, "Appointment date is required"],
    },
    timeSlot: {
      type: String, // e.g., "09:00 AM - 09:30 AM"
      required: [true, "Time slot is required"],
    },
    reason: {
      type: String,
      required: [true, "Reason for appointment is required"],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    notes: String,
    cancellationReason: String,
    consultationFee: Number,
    paymentStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Auto-generate appointmentId
appointmentSchema.pre("save", async function () {
  if (!this.appointmentId) {
    // Use this.constructor to refer to the model safely
    const count = await this.constructor.countDocuments();
    this.appointmentId = `APT-${Date.now()}-${count + 1}`;
  }
  this.updatedAt = new Date();
});

// Indexes for common queries
appointmentSchema.index({ patientId: 1 });
appointmentSchema.index({ date: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ doctorId: 1, date: 1 }); // Compound index covers individual doctorId queries too

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
