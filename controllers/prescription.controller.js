/**
 * Prescription Controller - All functions with default export
 */

import Prescription from "../models/Prescription.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { validate, prescriptionSchemas } from "../utils/validators.js";
import { NotFoundError } from "../utils/errors.js";

// Create prescription
const createPrescription = async (req, res, next) => {
  try {
    const { patientId, appointmentId, medications, diagnosis, notes, validUntil } = req.body;

    // Validate input
    const { error, value } = validate(prescriptionSchemas.create, req.body);
    if (error) {
      return sendError(res, "Validation failed", 400, error);
    }

    // Check if doctor exists
    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) {
      return sendError(res, "Doctor not found", 404);
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return sendError(res, "Patient not found", 404);
    }

    const prescription = new Prescription({
      doctorId: req.user.id,
      patientId,
      appointmentId,
      medications,
      diagnosis,
      notes,
      validUntil,
      isActive: true,
    });

    await prescription.save();

    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate("doctorId")
      .populate("patientId");

    return sendSuccess(res, populatedPrescription, "Prescription created successfully", 201);
  } catch (error) {
    next(error);
  }
};

// Get prescriptions with role-based access
const getPrescriptions = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const filter = {};

    // Role-based filtering
    if (req.user.role === "patient") {
      filter.patientId = req.user.id;
    } else if (req.user.role === "doctor") {
      filter.doctorId = req.user.id;
    } else if (req.user.role !== "admin") {
      return sendError(res, "Unauthorized", 403);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const prescriptions = await Prescription.find(filter)
      .populate("doctorId")
      .populate("patientId")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdDate: -1 });

    const total = await Prescription.countDocuments(filter);

    return sendSuccess(
      res,
      {
        prescriptions,
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      },
      "Prescriptions retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get prescription by ID
const getPrescriptionById = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId)
      .populate("doctorId")
      .populate("patientId");

    if (!prescription) {
      return sendError(res, "Prescription not found", 404);
    }

    // Role-based access check
    if (
      req.user.role === "patient" &&
      prescription.patientId._id.toString() !== req.user.id
    ) {
      return sendError(res, "Unauthorized access", 403);
    } else if (
      req.user.role === "doctor" &&
      prescription.doctorId._id.toString() !== req.user.id
    ) {
      return sendError(res, "Unauthorized access", 403);
    }

    return sendSuccess(res, prescription, "Prescription retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Update prescription
const updatePrescription = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;
    const { medications, diagnosis, notes } = req.body;

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return sendError(res, "Prescription not found", 404);
    }

    // Only doctor who created it can update
    if (prescription.doctorId.toString() !== req.user.id) {
      return sendError(res, "Only the prescribing doctor can update this prescription", 403);
    }

    // Check if prescription is expired
    if (new Date() > prescription.validUntil) {
      return sendError(res, "Cannot update expired prescription", 400);
    }

    const updatedPrescription = await Prescription.findByIdAndUpdate(
      prescriptionId,
      {
        medications: medications || prescription.medications,
        diagnosis: diagnosis || prescription.diagnosis,
        notes: notes || prescription.notes,
      },
      { new: true }
    )
      .populate("doctorId")
      .populate("patientId");

    return sendSuccess(res, updatedPrescription, "Prescription updated successfully");
  } catch (error) {
    next(error);
  }
};

// Delete prescription
const deletePrescription = async (req, res, next) => {
  try {
    const { prescriptionId } = req.params;

    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return sendError(res, "Prescription not found", 404);
    }

    // Only doctor who created it can delete
    if (prescription.doctorId.toString() !== req.user.id) {
      return sendError(res, "Only the prescribing doctor can delete this prescription", 403);
    }

    await Prescription.findByIdAndDelete(prescriptionId);

    return sendSuccess(res, null, "Prescription deleted successfully");
  } catch (error) {
    next(error);
  }
};

// Get patient prescription history
const getPrescriptionHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Check authorization
    if (req.user.role === "patient" && req.user.id !== patientId) {
      return sendError(res, "Unauthorized access", 403);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const prescriptions = await Prescription.find({ patientId })
      .populate("doctorId", "firstName lastName specialization")
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdDate: -1 });

    const total = await Prescription.countDocuments({ patientId });

    return sendSuccess(
      res,
      {
        prescriptions,
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      },
      "Prescription history retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Export all functions as default
export default {
  createPrescription,
  getPrescriptions,
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  getPrescriptionHistory,
};
