/**
 * Prescription Model
 */

import mongoose from "mongoose";

const prescriptionSchema = new mongoose.Schema(
  {
    prescriptionId: {
      type: String,
      unique: true,
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Doctor is required"],
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },
    medications: [
      {
        name: {
          type: String,
          required: [true, "Medicine name is required"],
        },
        dosage: {
          type: String,
          required: [true, "Dosage is required"],
        },
        frequency: {
          type: String, // e.g., "3 times a day"
          required: true,
        },
        duration: {
          type: String,
          required: [true, "Duration is required"],
        },
        instructions: String,
      },
    ],
    diagnosis: String,
    notes: String,
    createdDate: {
      type: Date,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from creation
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Auto-generate prescriptionId
prescriptionSchema.pre("save", async function (next) {
  if (!this.prescriptionId) {
    const count = await Prescription.countDocuments();
    this.prescriptionId = `RX-${Date.now()}-${count + 1}`;
  }
  next();
});

// Indexes for common queries
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ createdDate: -1 });
prescriptionSchema.index({ isActive: 1 });

const Prescription = mongoose.model("Prescription", prescriptionSchema);

export default Prescription;
