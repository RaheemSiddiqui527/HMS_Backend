import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { sendSuccess } from "../utils/response.js";

const getAdminReports = async (req, res, next) => {
  try {
    // 1. Financial Stats
    const financialStats = await Appointment.aggregate([
      {
        $match: { paymentStatus: "completed" }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$consultationFee" },
          avgFee: { $avg: "$consultationFee" },
          count: { $sum: 1 }
        }
      }
    ]);

    // 2. Revenue by Month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Appointment.aggregate([
      {
        $match: { 
          paymentStatus: "completed",
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: { 
            month: { $month: "$date" },
            year: { $year: "$date" }
          },
          revenue: { $sum: "$consultationFee" },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // 3. Clinical Performance (Appointment counts)
    const statusCounts = await Appointment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // 4. Doctor Performance (Top 5 doctors by appointments)
    const doctorStats = await Appointment.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$doctorId",
          appointmentCount: { $sum: 1 },
          revenue: { $sum: "$consultationFee" }
        }
      },
      { $sort: { appointmentCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "doctorInfo"
        }
      },
      { $unwind: "$doctorInfo" }
    ]);

    const stats = {
      financial: financialStats[0] || { totalRevenue: 0, avgFee: 0, count: 0 },
      monthlyRevenue,
      clinical: {
        total: statusCounts.reduce((acc, curr) => acc + curr.count, 0),
        byStatus: statusCounts,
        completionRate: statusCounts.find(s => s._id === "completed")?.count / statusCounts.reduce((acc, curr) => acc + curr.count, 0) || 0
      },
      topDoctors: doctorStats.map(d => ({
        name: `${d.doctorInfo.firstName} ${d.doctorInfo.lastName}`,
        count: d.appointmentCount,
        revenue: d.revenue
      }))
    };

    return sendSuccess(res, stats, "Reports generated successfully");
  } catch (error) {
    next(error);
  }
};

export default {
  getAdminReports
};
