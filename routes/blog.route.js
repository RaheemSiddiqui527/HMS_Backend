import express from "express";
import blogController from "../controllers/blog.controller.js";
import { protect, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/", blogController.getAllBlogs);
router.get("/:slug", blogController.getBlogBySlug);

// Admin-only routes for managing blogs
router.post("/", protect, requireRole("admin"), blogController.createBlog);
router.patch("/:blogId", protect, requireRole("admin"), blogController.updateBlog);
router.delete("/:blogId", protect, requireRole("admin"), blogController.deleteBlog);

export default router;
