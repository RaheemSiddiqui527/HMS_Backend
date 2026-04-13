/**
 * Reusable validation schemas using Joi
 */

import Joi from "joi";

export const authSchemas = {
  register: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters",
      "any.required": "Password is required",
    }),
    firstName: Joi.string().required().messages({
      "any.required": "First name is required",
    }),
    lastName: Joi.string().required().messages({
      "any.required": "Last name is required",
    }),
    phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/).messages({
      "string.pattern.base": "Invalid phone number format",
    }),
    role: Joi.string().valid("patient", "doctor", "admin", "staff").messages({
      "any.only": "Invalid role",
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required",
    }),
  }),

  updateProfile: Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]+$/),
  }),

  changePassword: Joi.object({
    oldPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required().messages({
      "any.only": "Passwords do not match",
    }),
  }),
};

export const appointmentSchemas = {
  book: Joi.object({
    patientId: Joi.string().required(),
    doctorId: Joi.string().required(),
    date: Joi.date().iso().required().messages({
      "date.base": "Invalid date format",
      "any.required": "Date is required",
    }),
    timeSlot: Joi.string().required().messages({
      "any.required": "Time slot is required",
    }),
    reason: Joi.string().required().messages({
      "any.required": "Reason for appointment is required",
    }),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid("pending", "confirmed", "completed", "cancelled").required(),
  }),
};

export const prescriptionSchemas = {
  create: Joi.object({
    patientId: Joi.string().required(),
    appointmentId: Joi.string(),
    medications: Joi.array()
      .items(
        Joi.object({
          name: Joi.string().required(),
          dosage: Joi.string().required(),
          duration: Joi.string().required(),
          instructions: Joi.string(),
        })
      )
      .required()
      .messages({
        "array.base": "Medications must be an array",
        "any.required": "At least one medication is required",
      }),
    notes: Joi.string(),
    validUntil: Joi.date().iso(),
  }),
};

export const notificationSchemas = {
  send: Joi.object({
    recipientId: Joi.string().required(),
    title: Joi.string().required(),
    message: Joi.string().required(),
    type: Joi.string().valid("normal", "urgent", "reminder"),
  }),

  createTemplate: Joi.object({
    name: Joi.string().required(),
    content: Joi.string().required(),
  }),
};

export const validate = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = {};
    error.details.forEach((detail) => {
      errors[detail.path.join(".")] = detail.message;
    });
    return { error: errors, value: null };
  }

  return { error: null, value };
};

export default {
  authSchemas,
  appointmentSchemas,
  prescriptionSchemas,
  notificationSchemas,
  validate,
};
