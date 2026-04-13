/**
 * Report & Analytics Controller - All functions with default export
 */

import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Staff from "../models/Staff.js";
import Appointment from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import { sendSuccess, sendError } from "../utils/response.js";

// Get dashboard statistics
const getDashboardStats = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return sendError(res, "Only admins can access dashboard stats", 403);
    }

    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalStaff = await Staff.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const activeUsers = await User.countDocuments({ status: "active" });

    // Appointment stats
    const completedAppointments = await Appointment.countDocuments({ status: "completed" });
    const pendingAppointments = await Appointment.countDocuments({ status: "pending" });
    const cancelledAppointments = await Appointment.countDocuments({ status: "cancelled" });

    return sendSuccess(
      res,
      {
        users: {
          totalPatients,
          totalDoctors,
          totalStaff,
          activeUsers,
        },
        appointments: {
          total: totalAppointments,
          completed: completedAppointments,
          pending: pendingAppointments,
          cancelled: cancelledAppointments,
        },
        summary: {
          totalUsers: totalPatients + totalDoctors + totalStaff,
          registeredUsers: totalPatients + totalDoctors + totalStaff,
        },
      },
      "Dashboard statistics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get recent activity
const getRecentActivity = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return sendError(res, "Only admins can access recent activity", 403);
    }

    const recentAppointments = await Appointment.find()
      .populate("patientId", "firstName lastName")
      .populate("doctorId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(10);

    const recentRegistrations = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("firstName lastName email role createdAt");

    return sendSuccess(
      res,
      {
        recentAppointments: recentAppointments.map((a) => ({
          id: a._id,
          patientName: `${a.patientId.firstName} ${a.patientId.lastName}`,
          doctorName: `${a.doctorId.firstName} ${a.doctorId.lastName}`,
          status: a.status,
          date: a.date,
          timestamp: a.createdAt,
        })),
        recentRegistrations: recentRegistrations.map((u) => ({
          id: u._id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          role: u.role,
          registeredAt: u.createdAt,
        })),
      },
      "Recent activity retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get appointment metrics
const getAppointmentMetrics = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return sendError(res, "Only admins can access appointment metrics", 403);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointmentsToday = await Appointment.countDocuments({
      date: { $gte: today, $lt: tomorrow },
    });

    const appointmentsThisWeek = await Appointment.countDocuments({
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const appointmentsThisMonth = await Appointment.countDocuments({
      date: {
        $gte: new Date(today.getFullYear(), today.getMonth(), 1),
        $lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
      },
    });

    const completionRate = await Appointment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    return sendSuccess(
      res,
      {
        appointmentsToday,
        appointmentsThisWeek,
        appointmentsThisMonth,
        completionMetrics: completionRate,
      },
      "Appointment metrics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get doctor metrics
const getDoctorMetrics = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return sendError(res, "Only admins can access doctor metrics", 403);
    }

    const doctorMetrics = await Doctor.aggregate([
      {
        $lookup: {
          from: "appointments",
          localField: "_id",
          foreignField: "doctorId",
          as: "appointments",
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          specialization: 1,
          rating: 1,
          totalAppointments: { $size: "$appointments" },
          completedAppointments: {
            $size: {
              $filter: {
                input: "$appointments",
                as: "apt",
                cond: { $eq: ["$$apt.status", "completed"] },
              },
            },
          },
        },
      },
      { $sort: { totalAppointments: -1 } },
      { $limit: 10 },
    ]);

    return sendSuccess(
      res,
      { doctors: doctorMetrics },
      "Doctor metrics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get patient metrics
const getPatientMetrics = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return sendError(res, "Only admins can access patient metrics", 403);
    }

    const totalPatients = await Patient.countDocuments();

    const patientsByGender = await Patient.aggregate([
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 },
        },
      },
    ]);

    const patientsByBloodType = await Patient.aggregate([
      {
        $group: {
          _id: "$bloodType",
          count: { $sum: 1 },
        },
      },
    ]);

    return sendSuccess(
      res,
      {
        totalPatients,
        byGender: patientsByGender,
        byBloodType: patientsByBloodType,
      },
      "Patient metrics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Get revenue metrics
const getRevenueMetrics = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return sendError(res, "Only admins can access revenue metrics", 403);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const revenueToday = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: today },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$consultationFee" },
          appointmentCount: { $sum: 1 },
        },
      },
    ]);

    const revenueThisMonth = await Appointment.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(today.getFullYear(), today.getMonth(), 1),
          },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$consultationFee" },
          appointmentCount: { $sum: 1 },
        },
      },
    ]);

    return sendSuccess(
      res,
      {
        revenueToday: revenueToday[0] || { totalRevenue: 0, appointmentCount: 0 },
        revenueThisMonth: revenueThisMonth[0] || { totalRevenue: 0, appointmentCount: 0 },
      },
      "Revenue metrics retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
};

// Generate comprehensive report
const generateReport = async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return sendError(res, "Only admins can generate reports", 403);
    }

    // Dashboard stats
    const totalPatients = await Patient.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const totalStaff = await Staff.countDocuments();
    const totalAppointments = await Appointment.countDocuments();
    const completedAppointments = await Appointment.countDocuments({ status: "completed" });
    const pendingAppointments = await Appointment.countDocuments({ status: "pending" });
    const activeUsers = await User.countDocuments({ status: "active" });

    // Recent appointments
    const recentAppointments = await Appointment.find()
      .populate("patientId", "firstName lastName")
      .populate("doctorId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(10);

    // Appointment metrics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentsToday = await Appointment.countDocuments({
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    });

    const appointmentMetrics = await Appointment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Doctor metrics
    const doctorMetrics = await Doctor.aggregate([
      {
        $lookup: {
          from: "appointments",
          localField: "_id",
          foreignField: "doctorId",
          as: "appointments",
        },
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          specialization: 1,
          totalAppointments: { $size: "$appointments" },
        },
      },
      { $sort: { totalAppointments: -1 } },
      { $limit: 5 },
    ]);

    // Revenue metrics
    const revenueToday = await Appointment.aggregate([
      {
        $match: {
          date: { $gte: today },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$consultationFee" },
          count: { $sum: 1 },
        },
      },
    ]);

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalUsers: totalPatients + totalDoctors + totalStaff,
        totalPatients,
        totalDoctors,
        totalStaff,
        activeUsers,
      },
      appointments: {
        total: totalAppointments,
        completed: completedAppointments,
        pending: pendingAppointments,
        today: appointmentsToday,
      },
      appointmentMetrics,
      topDoctors: doctorMetrics,
      revenue: revenueToday[0] || { totalRevenue: 0, count: 0 },
      recentActivities: recentAppointments.map((a) => ({
        type: "appointment",
        patient: `${a.patientId.firstName} ${a.patientId.lastName}`,
        doctor: `${a.doctorId.firstName} ${a.doctorId.lastName}`,
        status: a.status,
        date: a.date,
      })),
    };

    return sendSuccess(res, report, "Report generated successfully");
  } catch (error) {
    next(error);
  }
};

// Export all functions as default
export default {
  getDashboardStats,
  getRecentActivity,
  getAppointmentMetrics,
  getDoctorMetrics,
  getPatientMetrics,
  getRevenueMetrics,
  generateReport,
};
