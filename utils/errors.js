/**
 * Custom error classes for consistent error handling
 */

export class ValidationError extends Error {
  constructor(message, errors = null) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.errors = errors;
  }
}

export class AuthenticationError extends Error {
  constructor(message = "Authentication failed") {
    super(message);
    this.name = "AuthenticationError";
    this.statusCode = 401;
  }
}

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized access") {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = 403;
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
    this.statusCode = 404;
  }
}

export class ConflictError extends Error {
  constructor(message = "Resource conflict") {
    super(message);
    this.name = "ConflictError";
    this.statusCode = 409;
  }
}

export class ServerError extends Error {
  constructor(message = "Internal server error") {
    super(message);
    this.name = "ServerError";
    this.statusCode = 500;
  }
}

export default {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  ServerError,
};
