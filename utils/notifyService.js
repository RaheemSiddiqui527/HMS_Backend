/**
 * Notify Service — Unified Dual-Trigger Service
 *
 * Every important event triggers BOTH:
 *   1. 📧 Professional Email  (via emailService.js)
 *   2. 🔔 In-App Notification (stored in Notification model)
 *
 * Controllers should import and call functions from here only.
 * This keeps controllers clean and concerns separated.
 */

import Notification from "../models/Notification.js";
import emailService from "./emailService.js";
import { sendPushNotification } from "./pushNotificationService.js";

// ─────────────────────────────────────────────
// Internal helper — create in-app notification
// ─────────────────────────────────────────────
const createNotif = async ({
  recipientId,
  senderId = null,
  title,
  message,
  type = "normal",
  relatedEntity = null,
  relatedEntityId = null,
}) => {
  try {
    const notif = await Notification.create({
      recipientId,
      senderId,
      title,
      message,
      type,
      relatedEntity,
      relatedEntityId,
      isRead: false,
    });
    console.log(`🔔 Notification [${type}] → ${recipientId}`);
    
    // Trigger Push Notification
    sendPushNotification(recipientId, {
      title,
      body: message,
      data: {
        url: "/dashboard/notifications", // Default URL
        notifId: notif._id
      }
    });

    return notif;
  } catch (err) {
    console.error(`❌ Notification creation failed [${type}]:`, err.message);
    return null;
  }
};

// ─────────────────────────────────────────────
// 1. WELCOME — on user register
// ─────────────────────────────────────────────
export const notifyWelcome = async (user) => {
  const roleLabel = {
    patient: "Patient",
    doctor: "Doctor",
    admin: "Administrator",
    staff: "Staff Member",
  }[user.role] || user.role;

  await Promise.allSettled([
    // Email
    emailService.sendWelcomeEmail(user),

    // In-App Notification
    createNotif({
      recipientId: user._id,
      title: "Welcome to SDI Health Care! 🎉",
      message: `Your account has been created successfully as a ${roleLabel}. Access your dashboard to get started.`,
      type: "normal",
    }),
  ]);
};

// ─────────────────────────────────────────────
// 2. APPOINTMENT BOOKED — patient books an appointment
// ─────────────────────────────────────────────
export const notifyAppointmentBooked = async (appointment) => {
  const { patientId, doctorId, date, timeSlot, _id } = appointment;
  const appointmentDate = new Date(date).toLocaleDateString("en-IN", { dateStyle: "long" });

  await Promise.allSettled([
    // Email (sends to both patient & doctor)
    emailService.sendAppointmentBookedEmail(appointment),

    // In-App: Patient
    createNotif({
      recipientId: patientId._id || patientId,
      title: "Appointment Booked 📅",
      message: `Your appointment with Dr. ${doctorId.firstName || "your doctor"} ${doctorId.lastName || ""} is booked for ${appointmentDate} at ${timeSlot}.`,
      type: "appointment",
      relatedEntity: "appointment",
      relatedEntityId: _id,
    }),

    // In-App: Doctor
    createNotif({
      recipientId: doctorId._id || doctorId,
      title: "New Appointment Request 🔔",
      message: `${patientId.firstName || "A patient"} ${patientId.lastName || ""} has booked an appointment on ${appointmentDate} at ${timeSlot}.`,
      type: "appointment",
      relatedEntity: "appointment",
      relatedEntityId: _id,
    }),
  ]);
};

// ─────────────────────────────────────────────
// 3. APPOINTMENT CONFIRMED — doctor confirms
// ─────────────────────────────────────────────
export const notifyAppointmentConfirmed = async (appointment) => {
  const { patientId, doctorId, date, timeSlot, _id } = appointment;
  const appointmentDate = new Date(date).toLocaleDateString("en-IN", { dateStyle: "long" });

  await Promise.allSettled([
    // Email
    emailService.sendAppointmentConfirmedEmail(appointment),

    // In-App: Patient
    createNotif({
      recipientId: patientId._id || patientId,
      title: "Appointment Confirmed ✅",
      message: `Dr. ${doctorId.firstName || "Your doctor"} ${doctorId.lastName || ""} has confirmed your appointment for ${appointmentDate} at ${timeSlot}.`,
      type: "appointment",
      relatedEntity: "appointment",
      relatedEntityId: _id,
    }),
  ]);
};

// ─────────────────────────────────────────────
// 4. APPOINTMENT CANCELLED — any party cancels
// ─────────────────────────────────────────────
export const notifyAppointmentCancelled = async (appointment, cancelledByRole = "system") => {
  const { patientId, doctorId, date, timeSlot, _id, cancellationReason } = appointment;
  const appointmentDate = new Date(date).toLocaleDateString("en-IN", { dateStyle: "long" });
  const reason = cancellationReason || "No reason provided";

  await Promise.allSettled([
    // Email (sends to both)
    emailService.sendAppointmentCancelledEmail(appointment, cancelledByRole),

    // In-App: Patient
    createNotif({
      recipientId: patientId._id || patientId,
      title: "Appointment Cancelled ❌",
      message: `Your appointment on ${appointmentDate} at ${timeSlot} has been cancelled. Reason: ${reason}.`,
      type: "appointment",
      relatedEntity: "appointment",
      relatedEntityId: _id,
    }),

    // In-App: Doctor
    createNotif({
      recipientId: doctorId._id || doctorId,
      title: "Appointment Cancelled ❌",
      message: `Appointment scheduled for ${appointmentDate} at ${timeSlot} has been cancelled. Reason: ${reason}.`,
      type: "appointment",
      relatedEntity: "appointment",
      relatedEntityId: _id,
    }),
  ]);
};

// ─────────────────────────────────────────────
// 5. PRESCRIPTION ISSUED — doctor creates prescription
// ─────────────────────────────────────────────
export const notifyPrescriptionIssued = async (prescription) => {
  const { patientId, doctorId, _id, medications } = prescription;
  const medCount = medications?.length || 0;

  await Promise.allSettled([
    // Email
    emailService.sendPrescriptionEmail(prescription),

    // In-App: Patient
    createNotif({
      recipientId: patientId._id || patientId,
      title: "New Prescription Issued 💊",
      message: `Dr. ${doctorId.firstName || "Your doctor"} ${doctorId.lastName || ""} has issued a new prescription with ${medCount} medication(s). Check your portal to view and download.`,
      type: "prescription",
      relatedEntity: "prescription",
      relatedEntityId: _id,
    }),
  ]);
};

// ─────────────────────────────────────────────
// 6. LOGIN ALERT — new device login detected
// ─────────────────────────────────────────────
export const notifyLoginAlert = async (user, deviceInfo, ipAddress) => {
  await Promise.allSettled([
    // Email only (no in-app needed for security alerts)
    emailService.sendLoginAlertEmail(user, deviceInfo, ipAddress),
  ]);
};

// ─────────────────────────────────────────────
// 7. CUSTOM / FESTIVE NOTIFICATION
//    Admin or Doctor sends to one or many users
//    templateType: "birthday" | "eid_fitr" | "eid_adha" | "custom"
// ─────────────────────────────────────────────
export const notifyCustom = async (users, {
  templateType = "custom",
  senderName = "SDI Health Care Team",
  senderRole = "Administrator",
  customMessage = "",
  // For "eid_fitr" / "eid_adha"
  eidType = "Eid ul-Fitr",
  // For "custom"
  subject = "",
  title = "",
  message = "",
  badgeText = "Message from SDI Health Care",
  badgeColor = "#3b82f6",
  emoji = "💬",
  ctaText = null,
  ctaUrl = null,
} = {}) => {
  // Accept single user or array
  const userList = Array.isArray(users) ? users : [users];

  const notifConfig = {
    birthday: {
      title: "🎂 Happy Birthday!",
      message: `${senderName} wishes you a very Happy Birthday! May this year bring you great health and happiness.`,
      type: "normal",
    },
    eid_fitr: {
      title: "🌙 Eid ul-Fitr Mubarak!",
      message: `${senderName} wishes you and your family a blessed Eid ul-Fitr. عيد مبارك!`,
      type: "normal",
    },
    eid_adha: {
      title: "🐑 Eid ul-Adha Mubarak!",
      message: `${senderName} wishes you and your family a blessed Eid ul-Adha. عيد مبارك!`,
      type: "normal",
    },
    ramadan: {
      title: "🌙 Ramadan Mubarak! رَمَضَان مُبَارَك",
      message: `${senderName} wishes you a blessed Ramadan. May Allah accept your fasts and prayers. Ameen.`,
      type: "normal",
    },
    jumma: {
      title: "🕌 Jumma Mubarak! جُمُعَة مُبَارَك",
      message: `${senderName} wishes you a blessed Jumu'ah. May Allah accept your prayers and forgive your sins. Ameen.`,
      type: "normal",
    },
    islamic_new_year: {
      title: "🌙 Islamic New Year Mubarak! رَأْسُ السَّنَةِ الْهِجْرِيَّة",
      message: `${senderName} wishes you a blessed Islamic New Year. May Allah shower you with health, peace and barakah. Ameen.`,
      type: "normal",
    },
    custom: {
      title: title || subject || "Message from SDI Health Care",
      message: message || customMessage || "You have a new message from SDI Health Care.",
      type: "normal",
    },
  };

  const notifData = notifConfig[templateType] || notifConfig.custom;

  const tasks = userList.flatMap((user) => {
    const emailTask = (() => {
      switch (templateType) {
        case "birthday":
          return emailService.sendBirthdayEmail(user, { senderName, customMessage });
        case "eid_fitr":
          return emailService.sendEidEmail(user, { eidType: "Eid ul-Fitr", senderName, customMessage });
        case "eid_adha":
          return emailService.sendEidEmail(user, { eidType: "Eid ul-Adha", senderName, customMessage });
        case "ramadan":
          return emailService.sendRamadanEmail(user, { senderName, customMessage });
        case "jumma":
          return emailService.sendJummaEmail(user, { senderName, customMessage });
        case "islamic_new_year":
          return emailService.sendIslamicNewYearEmail(user, { senderName, customMessage });
        case "custom":
        default:
          return emailService.sendCustomMessageEmail(user, {
            subject, title, message: message || customMessage,
            senderName, senderRole,
            badgeText, badgeColor, emoji,
            ctaText, ctaUrl,
          });
      }
    })();

    const notifTask = createNotif({
      recipientId: user._id,
      title: notifData.title,
      message: notifData.message,
      type: notifData.type,
    });

    return [emailTask, notifTask];
  });

  const results = await Promise.allSettled(tasks);

  const sent = results.filter(r => r.status === "fulfilled").length;
  const failed = results.filter(r => r.status === "rejected").length;
  console.log(`📨 notifyCustom [${templateType}]: ${userList.length} users — ${sent} ok, ${failed} failed`);

  return { total: userList.length, sent, failed };
};

export default {
  notifyWelcome,
  notifyAppointmentBooked,
  notifyAppointmentConfirmed,
  notifyAppointmentCancelled,
  notifyPrescriptionIssued,
  notifyLoginAlert,
  notifyCustom,
};
