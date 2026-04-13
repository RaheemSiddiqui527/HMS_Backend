/**
 * Staff Model - extends User
 */

import mongoose from "mongoose";
import User from "./User.js";

const staffSchema = new mongoose.Schema(
  {
    designation: {
      type: String,
      required: [true, "Designation is required"],
      enum: [
        "Head Receptionist",
        "Receptionist",
        "Lab Technician",
        "Nursing Staff",
        "Pharmacist",
        "Data Entry Officer",
        "Accountant",
        "Manager",
      ],
    },
    department: {
      type: String,
      enum: [
        "Reception",
        "Laboratory",
        "Nursing",
        "Pharmacy",
        "Administration",
        "Accounting",
        "Management",
      ],
      required: [true, "Department is required"],
    },
    shift: {
      type: String,
      enum: ["morning", "afternoon", "night"],
      default: "morning",
    },
    hireDate: {
      type: Date,
      default: Date.now,
    },
    workingHours: {
      startTime: String,
      endTime: String,
    },
    qualifications: [
      {
        name: String,
        issueDate: Date,
      },
    ],
    reportsTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: false }
);

// Index for common queries
staffSchema.index({ department: 1 });
staffSchema.index({ designation: 1 });
staffSchema.index({ shift: 1 });

const Staff = User.discriminator("staff", staffSchema);

export default Staff;
