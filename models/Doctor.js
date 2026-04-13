/**
 * Doctor Model - extends User
 */

import mongoose from "mongoose";
import User from "./User.js";

const doctorSchema = new mongoose.Schema(
  {
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      enum: [
        "Cardiology",
        "Neurology",
        "Orthopedics",
        "Pediatrics",
        "General Practice",
        "Dermatology",
        "Gynecology",
        "Psychiatry",
        "Oncology",
        "Urology",
      ],
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
      min: 0,
    },
    qualifications: [
      {
        degree: String, // e.g., "MBBS", "MD"
        university: String,
        year: Number,
      },
    ],
    bio: {
      type: String,
      default: null,
    },
    clinicAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      phoneNumber: String,
    },
    availableSlots: [
      {
        dayOfWeek: Number, // 0-6 (Sunday-Saturday)
        startTime: String, // e.g., "09:00"
        endTime: String, // e.g., "17:00"
        slotDuration: Number, // in minutes
      },
    ],
    consultationFee: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationDocument: String, // URL to license/certificate
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalPatients: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: false }
);

// Index for common queries
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ licenseNumber: 1 });
doctorSchema.index({ isVerified: 1 });

const Doctor = User.discriminator("doctor", doctorSchema);

export default Doctor;
