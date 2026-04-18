/**
 * Appointment Controller - All functions with default export
 */

import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import { sendSuccess, sendError } from "../utils/response.js";
import { validate, appointmentSchemas } from "../utils/validators.js";
import { NotFoundError, ConflictError, ValidationError } from "../utils/errors.js";

// Generate available time slots for a doctor on a given date
const generateSlots = (startTime, endTime, slotDuration) => {
  const slots = [];
  let current = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);

  while (current < end) {
    const slotStart = current.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    current = new Date(current.getTime() + slotDuration * 60000);

    const slotEnd = current.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    slots.push(`${slotStart} - ${slotEnd}`);
  }

  return slots;
};

// Check availability for doctor
const checkAvailability = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return sendError(res, "Doctor ID and date are required", 400);
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return sendError(res, "Doctor not found", 404);
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.getDay();

    // Get doctor's available slots for this day
    const doctorSlot = doctor.availableSlots.find((s) => s.dayOfWeek === dayOfWeek);
    if (!doctorSlot) {
      return sendSuccess(res, { availableSlots: [] }, "No slots available on this day");
    }

    // Generate all possible slots
    const allSlots = generateSlots(doctorSlot.startTime, doctorSlot.endTime, doctorSlot.slotDuration);

    // Get booked appointments for this doctor on this date
    const bookedAppointments = await Appointment.find({
      doctorId,
      date: {
        $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
        $lt: new Date(appointmentDate.setHours(23, 59, 59, 999)),
      },
      status: { $ne: "cancelled" },
    });

    const bookedSlots = bookedAppointments.map((a) => a.timeSlot);
    const availableSlots = allSlots.filter((slot) => !bookedSlots.includes(slot));

    return sendSuccess(
      res,
      {
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        date,
        availableSlots,
        totalSlots: allSlots.length,
        bookedSlots: bookedSlots.length,
      },
      "Available slots retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Book appointment
const bookAppointment = async (req, res, next) => {
  try {
    const { patientId, doctorId, date, timeSlot, reason } = req.body;

    // Validate input
    const { error, value } = validate(appointmentSchemas.book, req.body);
    if (error) {
      return sendError(res, "Validation failed", 400, error);
    }

    // Check if patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return sendError(res, "Patient not found", 404);
    }

    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return sendError(res, "Doctor not found", 404);
    }

    // Check if slot is already booked
    const existingAppointment = await Appointment.findOne({
      doctorId,
      date: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
      },
      timeSlot,
      status: { $ne: "cancelled" },
    });

    if (existingAppointment) {
      return sendError(res, "This time slot is already booked", 409);
    }

    // Check if appointment is in the future
    const appointmentDateTime = new Date(`${date} ${timeSlot.split(" - ")[0]}`);
    if (appointmentDateTime <= new Date()) {
      return sendError(res, "Cannot book appointment in the past", 400);
    }

    const appointment = new Appointment({
      patientId,
      doctorId,
      date,
      timeSlot,
      reason,
      status: "pending",
      consultationFee: doctor.consultationFee,
    });

    await appointment.save();

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("patientId")
      .populate("doctorId");

    return sendSuccess(res, populatedAppointment, "Appointment booked successfully", 201);
  } catch (error) {
    next(error);
  }
};

// Get appointments with role-based filtering
const getAppointments = async (req, res, next) => {
  try {
    const { userId } = req.query;
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      return sendError(res, "User ID is required", 400);
    }

    const filter = {};

    // Role-based filtering
    if (req.user.role === "patient") {
      filter.patientId = userId;
    } else if (req.user.role === "doctor") {
      filter.doctorId = userId;
    } else if (req.user.role !== "admin") {
      return sendError(res, "Unauthorized", 403);
    }

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const appointments = await Appointment.find(filter)
      .populate({ path: "patientId", model: "patient" })
      .populate({ path: "doctorId", model: "doctor" })
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ date: -1 });

    const total = await Appointment.countDocuments(filter);

    return sendSuccess(
      res,
      {
        appointments,
        pagination: {
          total,
          pages: Math.ceil(total / parseInt(limit)),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
      },
      "Appointments retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get appointment by ID
const getAppointmentById = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;

    const appointment = await Appointment.findById(appointmentId)
      .populate("patientId")
      .populate("doctorId");

    if (!appointment) {
      return sendError(res, "Appointment not found", 404);
    }

    return sendSuccess(res, appointment, "Appointment retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Update appointment status
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;

    // Validate input
    const { error, value } = validate(appointmentSchemas.updateStatus, req.body);
    if (error) {
      return sendError(res, "Validation failed", 400, error);
    }

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status, updatedAt: new Date() },
      { new: true }
    )
      .populate("patientId")
      .populate("doctorId");

    if (!appointment) {
      return sendError(res, "Appointment not found", 404);
    }

    return sendSuccess(res, appointment, "Appointment status updated successfully");
  } catch (error) {
    next(error);
  }
};

// Cancel appointment
const cancelAppointment = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { cancellationReason } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        status: "cancelled",
        cancellationReason,
        updatedAt: new Date(),
      },
      { new: true }
    )
      .populate("patientId")
      .populate("doctorId");

    if (!appointment) {
      return sendError(res, "Appointment not found", 404);
    }

    return sendSuccess(res, appointment, "Appointment cancelled successfully");
  } catch (error) {
    next(error);
  }
};

// Get doctor's schedule for a specific date
const getDoctorSchedule = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return sendError(res, "Doctor ID and date are required", 400);
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return sendError(res, "Doctor not found", 404);
    }

    const appointments = await Appointment.find({
      doctorId,
      date: {
        $gte: new Date(date),
        $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000),
      },
    })
      .populate("patientId")
      .sort({ date: 1 });

    return sendSuccess(
      res,
      {
        doctor: {
          id: doctor._id,
          name: `${doctor.firstName} ${doctor.lastName}`,
          specialization: doctor.specialization,
        },
        date,
        appointments,
      },
      "Doctor schedule retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get all unique patients who have appointments with a specific doctor
const getMyPatients = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    
    // Find all unique patientIds from appointments for this doctor
    const patientIds = await Appointment.distinct("patientId", { doctorId });
    
    // Fetch patient details
    const patients = await Patient.find({ _id: { $in: patientIds } })
      .select("firstName lastName email phoneNumber gender dateOfBirth");

    return sendSuccess(res, patients, "Doctor's patients retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Export all functions as default
export default {
  checkAvailability,
  bookAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelAppointment,
  getDoctorSchedule,
  generateSlots,
  getMyPatients
};
