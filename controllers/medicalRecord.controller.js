/**
 * Medical Record Controller - All functions with default export
 */

import MedicalRecord from "../models/MedicalRecord.js";
import Patient from "../models/Patient.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { NotFoundError } from "../utils/errors.js";

// Add medical record
const addMedicalRecord = async (req, res, next) => {
  try {
    const { patientId, type, title, description, fileUrl, fileName, testName, testResult, normalRange } = req.body;

    // Validation
    if (!patientId || !type || !title) {
      return sendError(res, "Missing required fields: patientId, type, title", 400);
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return sendError(res, "Patient not found", 404);
    }

    const record = new MedicalRecord({
      patientId,
      type,
      title,
      description,
      fileUrl,
      fileName,
      testName,
      testResult,
      normalRange,
      createdBy: req.user.id, // Assuming doctor is creating
    });

    await record.save();

    const populatedRecord = await MedicalRecord.findById(record._id)
      .populate({ path: "patientId", model: "patient", select: "firstName lastName" })
      .populate({ path: "createdBy", model: "doctor", select: "firstName lastName" });

    return sendSuccess(res, populatedRecord, "Medical record added successfully", 201);
  } catch (error) {
    next(error);
  }
};

// Get medical records for a patient
const getMedicalRecords = async (req, res, next) => {
  try {
    let { patientId } = req.query;
    const { page = 1, limit = 10, type } = req.query;

    if (req.user.role === "patient") {
      patientId = req.user.id;
    }

    if (!patientId) {
      return sendError(res, "Patient ID is required", 400);
    }

    // Authorization check
    if (req.user.role === "patient" && req.user.id !== patientId) {
      return sendError(res, "Unauthorized access", 403);
    }

    const filter = { patientId };
    if (type) {
      filter.type = type;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const records = await MedicalRecord.find(filter)
      .populate({ path: "patientId", model: "patient", select: "firstName lastName email" })
      .populate({ path: "createdBy", model: "doctor", select: "firstName lastName specialization" })
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ createdDate: -1 });

    const total = await MedicalRecord.countDocuments(filter);

    return sendSuccess(
      res,
      {
        records,
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      },
      "Medical records retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get single medical record
const getMedicalRecordById = async (req, res, next) => {
  try {
    const { recordId } = req.params;

    const record = await MedicalRecord.findById(recordId)
      .populate("patientId", "firstName lastName email")
      .populate("createdBy", "firstName lastName specialization");

    if (!record) {
      return sendError(res, "Medical record not found", 404);
    }

    // Authorization check
    if (
      req.user.role === "patient" &&
      record.patientId._id.toString() !== req.user.id
    ) {
      return sendError(res, "Unauthorized access", 403);
    }

    return sendSuccess(res, record, "Medical record retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Update medical record
const updateRecord = async (req, res, next) => {
  try {
    const { recordId } = req.params;
    const { title, description, testResult, normalRange } = req.body;

    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return sendError(res, "Medical record not found", 404);
    }

    // Only doctor who created it can update
    if (record.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return sendError(res, "Unauthorized to update this record", 403);
    }

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(
      recordId,
      {
        title: title || record.title,
        description: description || record.description,
        testResult: testResult || record.testResult,
        normalRange: normalRange || record.normalRange,
        lastModifiedDate: new Date(),
      },
      { new: true }
    )
      .populate("patientId", "firstName lastName")
      .populate("createdBy", "firstName lastName");

    return sendSuccess(res, updatedRecord, "Medical record updated successfully");
  } catch (error) {
    next(error);
  }
};

// Delete medical record
const deleteRecord = async (req, res, next) => {
  try {
    const { recordId } = req.params;

    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return sendError(res, "Medical record not found", 404);
    }

    // Only doctor who created it can delete
    if (record.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
      return sendError(res, "Unauthorized to delete this record", 403);
    }

    await MedicalRecord.findByIdAndDelete(recordId);

    return sendSuccess(res, null, "Medical record deleted successfully");
  } catch (error) {
    next(error);
  }
};

// Get patient medical history
const getPatientMedicalHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const records = await MedicalRecord.find({ patientId })
      .populate("createdBy", "firstName lastName specialization")
      .sort({ createdDate: -1 });

    if (!records || records.length === 0) {
      return sendSuccess(res, [], "No medical records found for this patient");
    }

    return sendSuccess(res, records, "Medical history retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Export all functions as default
export default {
  addMedicalRecord,
  getMedicalRecords,
  getMedicalRecordById,
  updateRecord,
  deleteRecord,
  getPatientMedicalHistory,
};
