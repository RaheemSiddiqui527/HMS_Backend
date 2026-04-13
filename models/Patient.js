/**
 * Patient Model - extends User
 */

import mongoose from "mongoose";
import User from "./User.js";

const patientSchema = new mongoose.Schema(
  {
    dateOfBirth: {
      type: Date,
      default: null,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: null,
    },
    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      default: null,
    },
    weight: {
      type: Number, // in kg
      default: null,
    },
    height: {
      type: Number, // in cm
      default: null,
    },
    allergies: [
      {
        type: String,
      },
    ],
    medicalHistory: [
      {
        condition: String,
        yearsAgo: Number,
        notes: String,
      },
    ],
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    currentMedications: [
      {
        name: String,
        dosage: String,
        frequency: String,
      },
    ],
    insuranceProvider: String,
    insurancePolicyNumber: String,
  },
  { timestamps: false }
);

const Patient = User.discriminator("patient", patientSchema);

export default Patient;
