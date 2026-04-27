import jwt from "jsonwebtoken";
import { sendError } from "../utils/response.js";
import { AuthenticationError } from "../utils/errors.js";
import Session from "../models/Session.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return sendError(res, "No authorization token provided", 401);
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session exists and is active
    const session = await Session.findOne({ token, status: "active" });
    if (!session) {
      return sendError(res, "Session has been revoked or expired", 401);
    }

    // Update last active
    session.lastActive = new Date();
    await session.save();

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      // Also mark session as revoked if expired? 
      // Actually, better to just let it expire.
      return sendError(res, "Token has expired", 401);
    }
    return sendError(res, "Invalid or malformed token", 401);
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, "User not authenticated", 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, "Insufficient permissions for this action", 403);
    }

    next();
  };
};

export default { protect, requireRole };

