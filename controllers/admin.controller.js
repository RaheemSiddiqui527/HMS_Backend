/**
 * Admin Controller - All functions with default export
 */

import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Staff from "../models/Staff.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { validate, authSchemas } from "../utils/validators.js";
import { NotFoundError, ConflictError, ValidationError } from "../utils/errors.js";

// Get all users with filters
const getAllUsers = async (req, res, next) => {
  try {
    const { role, status, page = 1, limit = 10, search } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    return sendSuccess(
      res,
      {
        users: users.map((u) => u.toJSON()),
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      },
      "Users retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get user by ID
const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    return sendSuccess(res, user.toJSON(), "User retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Create doctor (admin only)
const createDoctor = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, specialization, licenseNumber, phoneNumber } =
      req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !specialization || !licenseNumber) {
      return sendError(
        res,
        "Missing required fields: email, password, firstName, lastName, specialization, licenseNumber",
        400
      );
    }

    // Check if doctor already exists
    const existingDoctor = await User.findOne({ email });
    if (existingDoctor) {
      return sendError(res, "Email already registered", 409);
    }

    // Check if license number already exists
    const existingLicense = await Doctor.findOne({ licenseNumber });
    if (existingLicense) {
      return sendError(res, "License number already in use", 409);
    }

    const newDoctor = new Doctor({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      specialization,
      licenseNumber,
      role: "doctor",
      status: "active",
      isVerified: false,
    });

    await newDoctor.save();

    return sendSuccess(res, newDoctor.toJSON(), "Doctor created successfully", 201);
  } catch (error) {
    next(error);
  }
};

// Create staff (admin only)
const createStaff = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, designation, department, phoneNumber } =
      req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !designation || !department) {
      return sendError(
        res,
        "Missing required fields: email, password, firstName, lastName, designation, department",
        400
      );
    }

    // Check if staff already exists
    const existingStaff = await User.findOne({ email });
    if (existingStaff) {
      return sendError(res, "Email already registered", 409);
    }

    const newStaff = new Staff({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      designation,
      department,
      role: "staff",
      status: "active",
    });

    await newStaff.save();

    return sendSuccess(res, newStaff.toJSON(), "Staff created successfully", 201);
  } catch (error) {
    next(error);
  }
};

// Update user status
const updateUserStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!["active", "inactive", "pending"].includes(status)) {
      return sendError(res, "Invalid status value", 400);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    return sendSuccess(res, user.toJSON(), "User status updated successfully");
  } catch (error) {
    next(error);
  }
};

// Delete user (soft delete or hard delete)
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { hardDelete = false } = req.query;

    if (hardDelete === "true") {
      // Hard delete
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        return sendError(res, "User not found", 404);
      }
      return sendSuccess(res, null, "User deleted successfully");
    } else {
      // Soft delete
      const user = await User.findByIdAndUpdate(
        userId,
        { status: "inactive", updatedAt: new Date() },
        { new: true }
      );

      if (!user) {
        return sendError(res, "User not found", 404);
      }

      return sendSuccess(res, user.toJSON(), "User deactivated successfully");
    }
  } catch (error) {
    next(error);
  }
};

// Get statistics
const getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalStaff = await Staff.countDocuments();
    const activeUsers = await User.countDocuments({ status: "active" });

    return sendSuccess(
      res,
      {
        totalUsers,
        totalPatients,
        totalDoctors,
        totalStaff,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
      },
      "Statistics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Export all functions as default
export default {
  getAllUsers,
  getUserById,
  createDoctor,
  createStaff,
  updateUserStatus,
  deleteUser,
  getStats,
};
