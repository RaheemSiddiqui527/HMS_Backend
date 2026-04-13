/**
 * Medical Record Model
 */

import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema(
  {
    recordId: {
      type: String,
      unique: true,
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "Patient is required"],
    },
    type: {
      type: String,
      enum: ["medical_history", "lab_result", "document", "vaccination", "prescription_history"],
      required: [true, "Record type is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
    },
    description: String,
    fileUrl: String, // URL to uploaded medical document
    fileName: String,
    testName: String, // For lab results
    testResult: String, // For lab results
    normalRange: String, // For lab results
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: [true, "Created by doctor is required"],
    },
    createdDate: {
      type: Date,
      default: Date.now,
    },
    lastModifiedDate: {
      type: Date,
      default: Date.now,
    },
    isConfidential: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Auto-generate recordId
medicalRecordSchema.pre("save", async function (next) {
  if (!this.recordId) {
    const count = await MedicalRecord.countDocuments();
    this.recordId = `MR-${Date.now()}-${count + 1}`;
  }
  this.lastModifiedDate = new Date();
  next();
});

// Indexes for common queries
medicalRecordSchema.index({ patientId: 1 });
medicalRecordSchema.index({ createdBy: 1 });
medicalRecordSchema.index({ type: 1 });
medicalRecordSchema.index({ createdDate: -1 });

const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);

export default MedicalRecord;
