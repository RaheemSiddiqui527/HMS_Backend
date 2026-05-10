/**
 * Auth Controller - All functions with default export
 */

import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Admin from "../models/Admin.js";
import Staff from "../models/Staff.js";
import Session from "../models/Session.js";
import { generateAccessToken, verifyToken } from "../utils/token.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { validate, authSchemas } from "../utils/validators.js";
import { ValidationError, AuthenticationError, NotFoundError, ConflictError } from "../utils/errors.js";
import { parseUA } from "../utils/uaParser.js";
import notifyService from "../utils/notifyService.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

    // Create session
    const deviceInfo = parseUA(req.headers["user-agent"]);
    await Session.create({
      userId: newUser._id,
      token,
      deviceInfo,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      status: "active",
    });

    // Send welcome email + in-app notification (non-blocking)
    notifyService.notifyWelcome(newUser).catch(() => {});

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

    // Create session
    const deviceInfo = parseUA(req.headers["user-agent"]);
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    await Session.create({
      userId: user._id,
      token,
      deviceInfo,
      ipAddress,
      status: "active",
    });

    // Send login alert email (non-blocking)
    notifyService.notifyLoginAlert(user, deviceInfo, ipAddress).catch(() => {});

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

// Social Login (Google, Facebook, etc.)
const socialLogin = async (req, res, next) => {
  try {
    const { email, firstName, lastName, provider, providerId, role = "patient" } = req.body;

    // Validate input
    const { error } = validate(authSchemas.socialLogin, req.body);
    if (error) {
      return sendError(res, "Validation failed", 400, error);
    }

    // Find user by email OR providerId
    let user = await User.findOne({ 
      $or: [
        { email },
        { providerId, authProvider: provider }
      ]
    });

    if (user) {
      // If user exists but wasn't linked to this provider, link it
      if (!user.providerId) {
        user.providerId = providerId;
        user.authProvider = provider;
        await user.save();
      }
    } else {
      // Create new user for social login
      const userData = {
        email,
        firstName: firstName || "Social",
        lastName: lastName || "User",
        role,
        authProvider: provider,
        providerId,
        status: "active",
      };

      switch (role) {
        case "patient":
          user = new Patient(userData);
          break;
        case "doctor":
          user = new Doctor({ ...userData, isVerified: false });
          break;
        case "admin":
          user = new Admin(userData);
          break;
        case "staff":
          user = new Staff(userData);
          break;
        default:
          user = new Patient(userData);
      }
      await user.save();
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

    // Create session
    const deviceInfo = parseUA(req.headers["user-agent"]);
    await Session.create({
      userId: user._id,
      token,
      deviceInfo,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      status: "active",
    });

    const userResponse = user.toJSON();

    return sendSuccess(
      res,
      {
        user: userResponse,
        token,
      },
      "Social login successful"
    );
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { idToken, role = "patient" } = req.body;

    if (!idToken) {
      return sendError(res, "Google ID Token is required", 400);
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: providerId, email, given_name: firstName, family_name: lastName, picture: avatar } = payload;

    // Use existing socialLogin logic or similar
    let user = await User.findOne({ 
      $or: [
        { email },
        { providerId, authProvider: "google" }
      ]
    });

    if (user) {
      if (!user.providerId || user.authProvider !== "google") {
        user.providerId = providerId;
        user.authProvider = "google";
        if (avatar && !user.avatar) user.avatar = avatar;
        await user.save();
      }
    } else {
      const userData = {
        email,
        firstName: firstName || "Google",
        lastName: lastName || "User",
        role,
        authProvider: "google",
        providerId,
        avatar,
        status: "active",
      };

      switch (role) {
        case "patient": user = new Patient(userData); break;
        case "doctor": user = new Doctor({ ...userData, isVerified: false }); break;
        case "admin": user = new Admin(userData); break;
        case "staff": user = new Staff(userData); break;
        default: user = new Patient(userData);
      }
      await user.save();
      notifyService.notifyWelcome(user).catch(() => {});
    }

    if (user.status === "inactive") {
      return sendError(res, "Your account has been deactivated", 403);
    }

    const token = generateAccessToken({
      id: user._id,
      email: user.email,
      role: user.role,
    });

    const deviceInfo = parseUA(req.headers["user-agent"]);
    await Session.create({
      userId: user._id,
      token,
      deviceInfo,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress,
      status: "active",
    });

    return sendSuccess(res, { user: user.toJSON(), token }, "Google login successful");
  } catch (error) {
    console.error("Google Auth Error:", error);
    return sendError(res, "Google authentication failed", 401);
  }
};

// Logout user (mainly for client-side cleanup, token invalidation can be handled via blacklist/Redis)
const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && (authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader);

    if (token) {
      // Mark session as revoked
      await Session.findOneAndUpdate({ token }, { status: "revoked" });
    }

    return sendSuccess(res, null, "Logout successful");
  } catch (error) {
    next(error);
  }
};

// Get all active sessions for current user
const getSessions = async (req, res, next) => {
  try {
    const sessions = await Session.find({
      userId: req.user.id,
      status: "active",
    }).sort({ lastActive: -1 });

    return sendSuccess(res, sessions, "Sessions fetched successfully");
  } catch (error) {
    next(error);
  }
};

// Revoke a specific session
const revokeSession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user.id,
    });

    if (!session) {
      return sendError(res, "Session not found", 404);
    }

    session.status = "revoked";
    await session.save();

    return sendSuccess(res, null, "Session revoked successfully");
  } catch (error) {
    next(error);
  }
};

// Revoke all sessions except current
const revokeAllOtherSessions = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const currentToken = authHeader && (authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader);

    await Session.updateMany(
      {
        userId: req.user.id,
        token: { $ne: currentToken },
        status: "active",
      },
      { status: "revoked" }
    );

    return sendSuccess(res, null, "All other sessions revoked successfully");
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

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, "User not found", 404);
    }
    return sendSuccess(res, user.toJSON(), "Profile retrieved successfully");
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const updateData = req.body;
    
    // Prevent role change via profile update
    delete updateData.role;
    delete updateData.password;
    delete updateData.email;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!user) {
      return sendError(res, "User not found", 404);
    }

    return sendSuccess(res, user.toJSON(), "Profile updated successfully");
  } catch (error) {
    next(error);
  }
};

// Export all functions as default
export default {
  register,
  login,
  socialLogin,
  googleLogin,
  logout,
  verifyUserToken,
  refreshToken,
  getSessions,
  revokeSession,
  revokeAllOtherSessions,
  getProfile,
  updateProfile,
};
