import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";

// Import routes
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import adminRoutes from "./routes/admin.route.js";
import appointmentRoutes from "./routes/appointment.route.js";
import prescriptionRoutes from "./routes/prescription.route.js";
import notificationRoutes from "./routes/notification.route.js";
import medicalRecordRoutes from "./routes/medicalRecord.route.js";
import reportRoutes from "./routes/report.route.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (optional)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/appointments", appointmentRoutes);
app.use("/api/v1/prescriptions", prescriptionRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/medical-records", medicalRecordRoutes);
app.use("/api/v1/reports", reportRoutes);

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "HMS Backend API running...",
    version: "1.0.0",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Connect to database and start server
connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
});
