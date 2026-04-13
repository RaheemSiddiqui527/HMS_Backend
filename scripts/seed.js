/**
 * Database Seed Script - Creates demo users for testing
 * Run: node scripts/seed.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Admin from "../models/Admin.js";
import Staff from "../models/Staff.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB");

    // Check if demo users already exist
    const adminExists = await Admin.findOne({ email: "admin@medicare.com" });
    const doctorExists = await Doctor.findOne({ email: "doctor@medicare.com" });
    const staffExists = await Staff.findOne({ email: "staff@medicare.com" });
    const patientExists = await Patient.findOne({ email: "patient@medicare.com" });

    const createdUsers = [];

    // Create Admin User
    if (!adminExists) {
      const admin = new Admin({
        email: "admin@medicare.com",
        password: "admin123",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        status: "active",
        phoneNumber: "+1 (555) 000-0001",
        permissions: [
          "manage_users",
          "manage_doctors",
          "manage_staff",
          "manage_patients",
          "view_reports",
          "manage_appointments",
          "manage_system",
          "view_analytics",
        ],
        isSystemAdmin: true,
      });
      await admin.save();
      createdUsers.push("Admin");
      console.log("✓ Created Admin user: admin@medicare.com");
    } else {
      console.log("⊘ Admin account already exists");
    }

    // Create Doctor User
    if (!doctorExists) {
      const doctor = new Doctor({
        email: "doctor@medicare.com",
        password: "doctor123",
        firstName: "Sarah",
        lastName: "Jenkins",
        role: "doctor",
        status: "active",
        phoneNumber: "+1 (555) 000-0002",
        specialization: "Cardiology",
        licenseNumber: "DOC-2024-001",
        yearsOfExperience: 8,
        qualifications: [
          {
            degree: "MBBS",
            university: "Medical University of South Carolina",
            year: 2016,
          },
          {
            degree: "MD",
            university: "Johns Hopkins University",
            year: 2020,
          },
        ],
        bio: "Experienced cardiologist with 8 years of practice",
        rating: 4.8,
        consultationFee: 150,
        isVerified: true,
        availableSlots: [
          { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
          { dayOfWeek: 2, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
          { dayOfWeek: 3, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
          { dayOfWeek: 4, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
          { dayOfWeek: 5, startTime: "09:00", endTime: "17:00", slotDuration: 30 },
        ],
      });
      await doctor.save();
      createdUsers.push("Doctor");
      console.log("✓ Created Doctor user: doctor@medicare.com");
    } else {
      console.log("⊘ Doctor account already exists");
    }

    // Create Staff User
    if (!staffExists) {
      const staff = new Staff({
        email: "staff@medicare.com",
        password: "staff123",
        firstName: "Jane",
        lastName: "Cooper",
        role: "staff",
        status: "active",
        phoneNumber: "+1 (555) 000-0003",
        designation: "Head Receptionist",
        department: "Reception",
        shift: "morning",
        workingHours: {
          startTime: "08:00",
          endTime: "16:00",
        },
        qualifications: [
          {
            name: "Medical Office Management Certification",
            issueDate: new Date("2021-06-15"),
          },
        ],
      });
      await staff.save();
      createdUsers.push("Staff");
      console.log("✓ Created Staff user: staff@medicare.com");
    } else {
      console.log("⊘ Staff account already exists");
    }

    // Create Patient User
    if (!patientExists) {
      const patient = new Patient({
        email: "patient@medicare.com",
        password: "patient123",
        firstName: "Emma",
        lastName: "Watson",
        role: "patient",
        status: "active",
        phoneNumber: "+1 (555) 000-0004",
        dateOfBirth: new Date("1995-03-15"),
        gender: "female",
        bloodType: "O+",
        weight: 60,
        height: 165,
        allergies: ["Penicillin"],
        medicalHistory: [
          {
            condition: "Asthma",
            yearsAgo: 5,
            notes: "Mild, well-controlled with inhalers",
          },
        ],
        emergencyContact: {
          name: "John Watson",
          relationship: "Brother",
          phoneNumber: "+1 (555) 123-4567",
        },
        address: {
          street: "123 Main Street",
          city: "New York",
          state: "NY",
          zipCode: "10001",
          country: "USA",
        },
        currentMedications: [
          {
            name: "Albuterol Inhaler",
            dosage: "100 mcg",
            frequency: "As needed",
          },
        ],
        insuranceProvider: "Blue Cross Blue Shield",
        insurancePolicyNumber: "BCBS-123456",
      });
      await patient.save();
      createdUsers.push("Patient");
      console.log("✓ Created Patient user: patient@medicare.com");
    } else {
      console.log("⊘ Patient account already exists");
    }

    console.log("\n✓ Database seeding completed!");
    if (createdUsers.length > 0) {
      console.log(`✓ Created ${createdUsers.length} new user(s): ${createdUsers.join(", ")}`);
    }
    console.log("\n📝 Demo Credentials:");
    console.log("   Admin:  admin@medicare.com / admin123");
    console.log("   Doctor: doctor@medicare.com / doctor123");
    console.log("   Staff:  staff@medicare.com / staff123");
    console.log("   Patient: patient@medicare.com / patient123");

    process.exit(0);
  } catch (error) {
    console.error("✗ Seeding failed:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
};

seedDatabase();
