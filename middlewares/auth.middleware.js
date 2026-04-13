import jwt from "jsonwebtoken";
import { sendError } from "../utils/response.js";
import { AuthenticationError } from "../utils/errors.js";

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return sendError(res, "No authorization token provided", 401);
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
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

