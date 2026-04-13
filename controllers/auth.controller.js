/**
 * Auth Controller - All functions with default export
 */

import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Admin from "../models/Admin.js";
import Staff from "../models/Staff.js";
import { generateAccessToken, verifyToken } from "../utils/token.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { validate, authSchemas } from "../utils/validators.js";
import { ValidationError, AuthenticationError, NotFoundError, ConflictError } from "../utils/errors.js";

// Register user based on role
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, role } = req.body;

    // Validate input
    const { error, value } = validate(authSchemas.register, req.body);
    if (error) {
      return sendError(res, "Validation failed", 400, error);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, "Email already registered", 409);
    }

    // Role-based registration rules
    // Only admins can register doctors, admins, and staff during registration
    // Patients can self-register
    if (!role) {
      return sendError(res, "Role is required", 400);
    }

    if (["doctor", "admin", "staff"].includes(role) && req.user?.role !== "admin") {
      return sendError(res, "Only admins can register doctors, admins, and staff", 403);
    }

    // Create user based on role
    let newUser;
    const userData = {
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      role,
      status: "active",
    };

    switch (role) {
      case "patient":
        newUser = new Patient(userData);
        break;
      case "doctor":
        newUser = new Doctor({
          ...userData,
          isVerified: false,
          specialization: req.body.specialization || "General Practice",
          licenseNumber: req.body.licenseNumber,
        });
        break;
      case "admin":
        newUser = new Admin(userData);
        break;
      case "staff":
        newUser = new Staff({
          ...userData,
          designation: req.body.designation || "Staff",
          department: req.body.department || "Administration",
        });
        break;
      default:
        return sendError(res, "Invalid role", 400);
    }

    await newUser.save();

    // Generate token
    const token = generateAccessToken({
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
    });

    // Return response without password
    const userResponse = newUser.toJSON();

    return sendSuccess(
      res,
      {
        user: userResponse,
        token,
      },
      "User registered successfully",
      201
    );
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const { error, value } = validate(authSchemas.login, req.body);
    if (error) {
      return sendError(res, "Validation failed", 400, error);
    }

    // Find user by email
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return sendError(res, "Invalid email or password", 401);
    }

    // Check password
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return sendError(res, "Invalid email or password", 401);
    }

    // Check user status
    if (user.status === "inactive") {
      return sendError(res, "Your account has been deactivated", 403);
    }

    // Generate token
    const token = generateAccessToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    // Return response without password
    const userResponse = user.toJSON();

    return sendSuccess(
      res,
      {
        user: userResponse,
        token,
      },
      "Login successful"
    );
  } catch (error) {
    next(error);
  }
};

// Logout user (mainly for client-side cleanup, token invalidation can be handled via blacklist/Redis)
const logout = async (req, res, next) => {
  try {
    // In a production app, you might want to:
    // 1. Add token to blacklist in Redis/database
    // 2. Remove refresh token from database
    // 3. Invalidate all active sessions

    return sendSuccess(res, null, "Logout successful");
  } catch (error) {
    next(error);
  }
};

// Verify token and get user info
const verifyUserToken = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendError(res, "Token not provided", 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    if (user.status === "inactive") {
      return sendError(res, "User account is inactive", 403);
    }

    const userResponse = user.toJSON();

    return sendSuccess(res, userResponse, "Token verified");
  } catch (error) {
    next(error);
  }
};

// Refresh token
const refreshToken = async (req, res, next) => {
  try {
    if (!req.user) {
      return sendError(res, "No token to refresh", 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    if (user.status === "inactive") {
      return sendError(res, "User account is inactive", 403);
    }

    // Generate new token
    const newToken = generateAccessToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    return sendSuccess(
      res,
      { token: newToken },
      "Token refreshed successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Export all functions as default
export default {
  register,
  login,
  logout,
  verifyUserToken,
  refreshToken,
};
