/**
 * Global error handler middleware
 */

import { sendError } from "../utils/response.js";
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ServerError,
} from "../utils/errors.js";

export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error("Error:", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  // Handle custom errors
  if (err instanceof ValidationError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  if (err instanceof AuthenticationError) {
    return sendError(res, err.message, err.statusCode);
  }

  if (err instanceof AuthorizationError) {
    return sendError(res, err.message, err.statusCode);
  }

  if (err instanceof NotFoundError) {
    return sendError(res, err.message, err.statusCode);
  }

  if (err instanceof ConflictError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const errors = {};
    Object.keys(err.errors).forEach((field) => {
      errors[field] = err.errors[field].message;
    });
    return sendError(res, "Validation failed", 400, errors);
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return sendError(res, `${field} already exists`, 409);
  }

  // Default to server error
  return sendError(res, "Internal server error", 500);
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default { errorHandler, asyncHandler };
