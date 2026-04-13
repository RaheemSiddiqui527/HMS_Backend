/**
 * User Controller - All functions with default export
 */

import User from "../models/User.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { validate, authSchemas } from "../utils/validators.js";
import { comparePassword, hashPassword } from "../utils/hash.js";
import { NotFoundError } from "../utils/errors.js";

// Get user profile
const getProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendError(res, "User not authenticated", 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const userResponse = user.toJSON();
    return sendSuccess(res, userResponse, "Profile retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendError(res, "User not authenticated", 401);
    }

    const { error, value } = validate(authSchemas.updateProfile, req.body);
    if (error) {
      return sendError(res, "Validation failed", 400, error);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        firstName: value.firstName || undefined,
        lastName: value.lastName || undefined,
        phoneNumber: value.phoneNumber || undefined,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    );

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const userResponse = user.toJSON();
    return sendSuccess(res, userResponse, "Profile updated successfully");
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendError(res, "User not authenticated", 401);
    }

    const { error, value } = validate(authSchemas.changePassword, req.body);
    if (error) {
      return sendError(res, "Validation failed", 400, error);
    }

    const user = await User.findById(req.user.id).select("+password");
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    // Verify old password
    const isPasswordValid = await comparePassword(value.oldPassword, user.password);
    if (!isPasswordValid) {
      return sendError(res, "Current password is incorrect", 401);
    }

    // Update password
    user.password = await hashPassword(value.newPassword);
    user.updatedAt = new Date();
    await user.save();

    return sendSuccess(res, null, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};

// Delete/Deactivate account
const deleteAccount = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendError(res, "User not authenticated", 401);
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { status: "inactive", updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    return sendSuccess(res, null, "Account deactivated successfully");
  } catch (error) {
    next(error);
  }
};

// Get user by ID (admin access)
const getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const userResponse = user.toJSON();
    return sendSuccess(res, userResponse, "User retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Export all functions as default
export default {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  getUserById,
};
