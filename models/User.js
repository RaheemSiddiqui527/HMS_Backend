/**
 * Base User Model - serves as parent schema for all user types
 */

import mongoose from "mongoose";
import { hashPassword, comparePassword } from "../utils/hash.js";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't return password by default
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
    },
    phoneNumber: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin", "staff"],
      required: [true, "Role is required"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
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
  { discriminatorKey: "role", timestamps: false }
);

// Index for common queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

// Pre-save hook to hash password
userSchema.pre("save", async function () {
  // Skip if password not modified
  if (!this.isModified("password")) return;

  try {
    this.password = await hashPassword(this.password);
    this.updatedAt = new Date();
  } catch (error) {
    throw error;
  }
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await comparePassword(enteredPassword, this.password);
};

// Method to get user without sensitive data
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

const User = mongoose.model("User", userSchema);

export default User;
