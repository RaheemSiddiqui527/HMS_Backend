/**
 * Admin Model - extends User
 */

import mongoose from "mongoose";
import User from "./User.js";

const adminSchema = new mongoose.Schema(
  {
    permissions: [
      {
        type: String,
        enum: [
          "manage_users",
          "manage_doctors",
          "manage_staff",
          "manage_patients",
          "view_reports",
          "manage_appointments",
          "manage_system",
          "view_analytics",
        ],
      },
    ],
    department: {
      type: String,
      enum: ["Administration", "Medical", "IT", "Finance", "HR"],
      default: "Administration",
    },
    hireDate: {
      type: Date,
      default: Date.now,
    },
    isSystemAdmin: {
      type: Boolean,
      default: false, // true = full access, false = limited permissions
    },
  },
  { timestamps: false }
);

const Admin = User.discriminator("admin", adminSchema);

export default Admin;
