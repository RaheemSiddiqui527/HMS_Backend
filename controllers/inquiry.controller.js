import Inquiry from "../models/Inquiry.js";
import { sendSuccess, sendError } from "../utils/response.js";

// Submit a new inquiry (Public)
const submitInquiry = async (req, res, next) => {
  try {
    const { fullName, email, phoneNumber, department, message } = req.body;
    
    const newInquiry = new Inquiry({
      fullName,
      email,
      phoneNumber,
      department,
      message,
    });

    await newInquiry.save();
    return sendSuccess(res, newInquiry, "Inquiry submitted successfully. We will contact you soon.", 201);
  } catch (error) {
    next(error);
  }
};

// Get all inquiries (Admin only)
const getAllInquiries = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = {};
    if (status && status !== 'all') filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Inquiry.countDocuments(filter);
    
    const inquiries = await Inquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return sendSuccess(res, {
      inquiries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    }, "Inquiries retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Update inquiry status (Admin only)
const updateInquiryStatus = async (req, res, next) => {
  try {
    const { inquiryId } = req.params;
    const { status } = req.body;

    const inquiry = await Inquiry.findByIdAndUpdate(
      inquiryId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!inquiry) {
      return sendError(res, "Inquiry not found", 404);
    }

    return sendSuccess(res, inquiry, `Inquiry marked as ${status}`);
  } catch (error) {
    next(error);
  }
};

export default {
  submitInquiry,
  getAllInquiries,
  updateInquiryStatus,
};
