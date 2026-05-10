import Blog from "../models/Blog.js";
import { sendSuccess, sendError } from "../utils/response.js";

// Create a new blog post
const createBlog = async (req, res, next) => {
  try {
    const { title, content, excerpt, coverImage, category, tags, status } = req.body;
    
    const newBlog = new Blog({
      title,
      content,
      excerpt,
      coverImage,
      category,
      tags,
      status,
      author: req.user.id,
    });

    await newBlog.save();
    return sendSuccess(res, newBlog, "Blog post created successfully", 201);
  } catch (error) {
    next(error);
  }
};

// Get all blogs (public)
const getAllBlogs = async (req, res, next) => {
  try {
    const { category, status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (category) query.category = category;
    if (status && status !== 'all') query.status = status;

    const skip = (page - 1) * limit;
    const total = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .populate("author", "firstName lastName avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return sendSuccess(res, {
      blogs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    }, "Blogs retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Get single blog by slug
const getBlogBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    ).populate("author", "firstName lastName avatar");

    if (!blog) {
      return sendError(res, "Blog post not found", 404);
    }

    return sendSuccess(res, blog, "Blog retrieved successfully");
  } catch (error) {
    next(error);
  }
};

// Update blog post
const updateBlog = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const updateData = req.body;

    const blog = await Blog.findByIdAndUpdate(
      blogId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!blog) {
      return sendError(res, "Blog post not found", 404);
    }

    return sendSuccess(res, blog, "Blog updated successfully");
  } catch (error) {
    next(error);
  }
};

// Delete blog post
const deleteBlog = async (req, res, next) => {
  try {
    const { blogId } = req.params;
    const blog = await Blog.findByIdAndDelete(blogId);

    if (!blog) {
      return sendError(res, "Blog post not found", 404);
    }

    return sendSuccess(res, null, "Blog post deleted successfully");
  } catch (error) {
    next(error);
  }
};

export default {
  createBlog,
  getAllBlogs,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
};
