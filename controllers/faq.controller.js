import FAQ from "../models/FAQ.js";
import { sendSuccess, sendError } from "../utils/response.js";

// Get all FAQs (Public)
const getAllFAQs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    const total = await FAQ.countDocuments({ isActive: true });
    
    const faqs = await FAQ.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return sendSuccess(res, {
      faqs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    }, "FAQs retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Create a new FAQ (Admin only)
const createFAQ = async (req, res, next) => {
  try {
    const { question, answer, category, order } = req.body;
    const faq = new FAQ({ question, answer, category, order });
    await faq.save();
    return sendSuccess(res, faq, "FAQ created successfully", 201);
  } catch (error) {
    next(error);
  }
};

// Update an FAQ (Admin only)
const updateFAQ = async (req, res, next) => {
  try {
    const { faqId } = req.params;
    const faq = await FAQ.findByIdAndUpdate(faqId, req.body, { new: true });
    if (!faq) return sendError(res, "FAQ not found", 404);
    return sendSuccess(res, faq, "FAQ updated successfully");
  } catch (error) {
    next(error);
  }
};

// Delete an FAQ (Admin only)
const deleteFAQ = async (req, res, next) => {
  try {
    const { faqId } = req.params;
    const faq = await FAQ.findByIdAndDelete(faqId);
    if (!faq) return sendError(res, "FAQ not found", 404);
    return sendSuccess(res, null, "FAQ deleted successfully");
  } catch (error) {
    next(error);
  }
};

export default {
  getAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
};
