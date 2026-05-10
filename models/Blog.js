import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: [true, "Blog content is required"],
    },
    excerpt: {
      type: String,
      required: [true, "Short excerpt is required"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverImage: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      default: "Health",
    },
    tags: [String],
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "published",
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Auto-generate slug from title before saving
blogSchema.pre("validate", function () {
  if (this.title && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-");
  }
});

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
