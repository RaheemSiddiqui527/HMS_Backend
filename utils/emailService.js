/**
 * Email Service — SDI Health Care
 * Professional HTML email templates with SDI brand identity.
 * Every send is logged to the EmailLog collection.
 */

import nodemailer from "nodemailer";
import dns from "dns";
import PDFDocument from "pdfkit";
import dotenv from "dotenv";
import EmailLog from "../models/EmailLog.js";

// Force IPv4-first globally
dns.setDefaultResultOrder("ipv4first");

dotenv.config();

let transporter;

// Lazy initialization of transporter
const getTransporter = () => {
  if (!transporter) {
    console.log("DEBUG: Initializing Nuclear SMTP fix for Render...");

    transporter = nodemailer.createTransport({
      host: "64.233.184.108", // Direct IPv4 for smtp.gmail.com
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_PASS || process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        servername: "smtp.gmail.com",
      },
      connectionTimeout: 60000,
      greetingTimeout: 60000,
    });
  }
  return transporter;
};

// ─────────────────────────────────────────────
// Brand Tokens
// ─────────────────────────────────────────────
const BRAND = {
  green:       "#1a7a4a",   // Primary SDI green
  greenDark:   "#0f5132",   // Dark green (header gradient end)
  greenDeep:   "#0a3d26",   // Deepest green (header gradient start)
  greenLight:  "#e8f5ee",   // Light green tint background
  greenMint:   "#d1f0e0",   // Mint accent
  greenAccent: "#22c55e",   // Bright green accent / CTA
  white:       "#ffffff",
  offWhite:    "#f8faf9",
  navy:        "#0f172a",
  slateText:   "#374151",
  mutedText:   "#6b7280",
  border:      "#d1e8da",
  shadow:      "rgba(10, 61, 38, 0.12)",
  portalUrl:   process.env.FRONTEND_URL || "http://localhost:3000",
};

// ─────────────────────────────────────────────
// Master Layout
// ─────────────────────────────────────────────
const layout = (content, footerNote = "", accentColor = BRAND.green) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>SDI Health Care</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#eef5f0;font-family:'Trebuchet MS',Georgia,sans-serif;-webkit-font-smoothing:antialiased;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#eef5f0;padding:40px 16px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" role="presentation"
             style="max-width:600px;width:100%;background:${BRAND.white};border-radius:20px;overflow:hidden;box-shadow:0 8px 40px ${BRAND.shadow};">

        <!-- ═══ HEADER ═══ -->
        <tr>
          <td style="background:linear-gradient(160deg,${BRAND.greenDeep} 0%,${BRAND.greenDark} 55%,${BRAND.green} 100%);padding:0;">
            <!-- Top accent stripe -->
            <div style="height:4px;background:linear-gradient(90deg,${BRAND.greenAccent},#4ade80,${BRAND.greenAccent});"></div>
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="padding:28px 40px 24px;">
              <tr>
                <td valign="middle">
                  <!-- Logo mark -->
                  <table cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td valign="middle" style="padding-right:14px;">
                        <div style="width:52px;height:52px;background:${BRAND.white};border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.2);">
                          <table cellpadding="0" cellspacing="0" role="presentation" style="width:52px;height:52px;">
                            <tr><td align="center" valign="middle">
                              <span style="font-size:22px;font-weight:900;color:${BRAND.greenDark};letter-spacing:-1px;line-height:1;">SDI</span>
                            </td></tr>
                          </table>
                        </div>
                      </td>
                      <td valign="middle">
                        <div style="font-size:20px;font-weight:800;color:${BRAND.white};letter-spacing:0.5px;line-height:1.1;">SDI Health Care</div>
                        <div style="font-size:10px;color:rgba(255,255,255,0.55);letter-spacing:3px;text-transform:uppercase;margin-top:3px;">Official Communication</div>
                      </td>
                    </tr>
                  </table>
                </td>
                <td align="right" valign="middle">
                  <div style="border:1px solid rgba(255,255,255,0.2);border-radius:20px;padding:6px 14px;display:inline-block;background:rgba(255,255,255,0.07);">
                    <span style="font-size:10px;color:rgba(255,255,255,0.6);letter-spacing:2px;text-transform:uppercase;">Confidential</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ═══ BODY ═══ -->
        <tr>
          <td style="padding:40px 44px 32px;">
            ${content}
          </td>
        </tr>

        <!-- ═══ DIVIDER ═══ -->
        <tr>
          <td style="padding:0 44px;">
            <div style="height:1px;background:linear-gradient(90deg,transparent,${BRAND.border},transparent);"></div>
          </td>
        </tr>

        <!-- ═══ FOOTER ═══ -->
        <tr>
          <td style="padding:20px 44px 28px;background:${BRAND.offWhite};">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td>
                  <div style="font-size:11px;color:#9ca3af;line-height:1.6;">
                    ${footerNote || "This is an automated message from SDI Health Care. Please do not reply directly."}
                  </div>
                  <div style="font-size:10px;color:#d1d5db;margin-top:6px;">
                    &copy; ${new Date().getFullYear()} SDI Health Care &nbsp;&bull;&nbsp; Powered by Sunni Dawate Islami &nbsp;&bull;&nbsp; Confidential
                  </div>
                </td>
                <td align="right" valign="bottom">
                  <a href="${BRAND.portalUrl}" style="font-size:11px;color:${BRAND.green};text-decoration:none;font-weight:600;">Visit Portal →</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ═══ BOTTOM STRIPE ═══ -->
        <tr>
          <td style="height:5px;background:linear-gradient(90deg,${BRAND.greenAccent},#4ade80,${BRAND.greenAccent});"></td>
        </tr>

      </table>

      <!-- Sub-footer note -->
      <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;margin-top:16px;">
        <tr>
          <td align="center">
            <span style="font-size:11px;color:#94a3b8;">SDI Health Care &mdash; Modern Hospital Management System</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`;

// ─────────────────────────────────────────────
// Component Helpers
// ─────────────────────────────────────────────

/** Status badge pill */
const badge = (text, color = BRAND.green) =>
  `<span style="display:inline-block;background:${color};color:#fff;font-size:10px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:1.5px;text-transform:uppercase;">${text}</span>`;

/** Arabic greeting block */
const salam = (name, subtitle = "") => `
  <h2 style="color:${BRAND.navy};margin:20px 0 2px;font-size:22px;font-weight:800;">Assalamu Alaikum, ${name}!</h2>
  <p style="color:${BRAND.mutedText};font-size:12px;font-style:italic;margin:0 0 ${subtitle ? "4px" : "20px"};">السلام عليكم ورحمة الله وبركاته</p>
  ${subtitle ? `<p style="color:${BRAND.mutedText};font-size:12px;margin:0 0 20px;">${subtitle}</p>` : ""}
`;

/** Structured info table */
const infoBox = (rows) => `
  <div style="background:${BRAND.greenLight};border:1px solid ${BRAND.border};border-radius:12px;padding:20px 24px;margin:24px 0;border-left:4px solid ${BRAND.green};">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      ${rows.map(([label, value], i) => `
        <tr style="${i < rows.length - 1 ? `border-bottom:1px solid ${BRAND.border};` : ""}">
          <td style="padding:8px 0;font-size:11px;color:${BRAND.green};font-weight:700;text-transform:uppercase;letter-spacing:1px;width:150px;">${label}</td>
          <td style="padding:8px 0;font-size:13px;color:${BRAND.navy};font-weight:600;">${value}</td>
        </tr>
      `).join("")}
    </table>
  </div>
`;

/** Primary CTA button */
const ctaButton = (text, href, color = BRAND.green) =>
  `<table cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;">
    <tr>
      <td style="background:${color};border-radius:10px;box-shadow:0 4px 14px rgba(26,122,74,0.35);">
        <a href="${href}" style="display:inline-block;color:#ffffff;padding:14px 30px;text-decoration:none;font-size:14px;font-weight:700;letter-spacing:0.3px;">${text}</a>
      </td>
    </tr>
  </table>`;

/** Alert / notice box */
const alertBox = (text, type = "warning") => {
  const styles = {
    warning: { bg: "#fffbeb", border: "#f59e0b", text: "#78350f" },
    danger:  { bg: "#fef2f2", border: "#dc2626", text: "#7f1d1d" },
    success: { bg: "#f0fdf4", border: BRAND.green,  text: "#14532d" },
    info:    { bg: "#eff6ff", border: "#3b82f6", text: "#1e3a8a" },
  }[type] || styles.info;
  return `<div style="background:${styles.bg};border-left:4px solid ${styles.border};border-radius:0 10px 10px 0;padding:14px 18px;margin-top:20px;">
    <p style="margin:0;font-size:13px;color:${styles.text};line-height:1.6;">${text}</p>
  </div>`;
};

/** Section heading */
const sectionHead = (title, icon = "") =>
  `<div style="margin:28px 0 16px;">
    <h3 style="color:${BRAND.navy};margin:0 0 8px;font-size:16px;font-weight:800;">${icon ? icon + " " : ""}${title}</h3>
    <div style="height:2px;width:40px;background:${BRAND.greenAccent};border-radius:2px;"></div>
  </div>`;

// ─────────────────────────────────────────────
// PDF Generator — Prescription
// ─────────────────────────────────────────────

/**
 * Generates a branded SDI Health Care prescription PDF.
 * Returns a Promise<Buffer> — ready to attach to nodemailer.
 */
export const generatePrescriptionPDF = (prescription) => {
  return new Promise((resolve, reject) => {
    const { patientId, doctorId, medications, notes, diagnosis, createdDate, _id } = prescription;
    const rxId   = `RX-${_id.toString().slice(-8).toUpperCase()}`;
    const issued = new Date(createdDate || Date.now()).toLocaleDateString("en-IN", { dateStyle: "long" });

    // ── Colors ──────────────────────────────────
    const GREEN_DEEP  = "#0a3d26";
    const GREEN_MAIN  = "#1a7a4a";
    const GREEN_LIGHT = "#e8f5ee";
    const GREEN_ACC   = "#22c55e";
    const NAVY        = "#0f172a";
    const SLATE       = "#374151";
    const MUTED       = "#6b7280";
    const BORDER      = "#d1e8da";
    const WHITE       = "#ffffff";

    const doc = new PDFDocument({ size: "A4", margin: 0, bufferPages: true });
    const chunks = [];
    doc.on("data",  (c) => chunks.push(c));
    doc.on("end",   ()  => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;   // 595
    const H = doc.page.height;  // 842
    const ML = 50, MR = 50;     // left/right margin
    const CW = W - ML - MR;     // content width = 495

    // ── Helper: hex to RGB ───────────────────
    const hex = (h) => {
      const n = parseInt(h.replace("#",""), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };

    // ── TOP GRADIENT HEADER ──────────────────
    // Simulate gradient with two overlapping rects
    doc.rect(0, 0, W, 110).fill(GREEN_DEEP);
    doc.rect(W * 0.5, 0, W * 0.5, 110).fillOpacity(0.35).fill(GREEN_MAIN);
    doc.fillOpacity(1);

    // Top accent stripe
    doc.rect(0, 0, W, 5).fill(GREEN_ACC);

    // SDI logo box
    doc.roundedRect(ML, 22, 50, 50, 8).fill(WHITE);
    doc.font("Helvetica-Bold").fontSize(16).fillColor(GREEN_DEEP)
       .text("SDI", ML, 40, { width: 50, align: "center" });

    // Brand name
    doc.font("Helvetica-Bold").fontSize(18).fillColor(WHITE)
       .text("SDI Health Care", ML + 62, 28);
    doc.font("Helvetica").fontSize(8).fillColor("rgba(255,255,255,0.5)")
       .text("OFFICIAL MEDICAL DOCUMENT", ML + 62, 50, { characterSpacing: 1.5 });

    // "Digital Prescription" pill on right
    doc.roundedRect(W - MR - 140, 30, 140, 26, 13)
       .strokeColor("rgba(255,255,255,0.25)").lineWidth(1).stroke();
    doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE)
       .text("DIGITAL PRESCRIPTION", W - MR - 140, 39, { width: 140, align: "center", characterSpacing: 1 });

    // Bottom stripe on header
    doc.rect(0, 105, W, 5).fill(GREEN_ACC);

    // ── RX ID BAND ───────────────────────────
    doc.rect(0, 110, W, 36).fill(GREEN_LIGHT);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(GREEN_MAIN)
       .text(`Prescription ID: ${rxId}`, ML, 122);
    doc.font("Helvetica").fontSize(10).fillColor(MUTED)
       .text(`Issued: ${issued}`, 0, 122, { width: W - MR, align: "right" });

    let y = 165;

    // ── SECTION: Patient & Doctor info ───────
    const boxH = 90;
    // Patient box
    doc.roundedRect(ML, y, CW * 0.48, boxH, 8).fill(GREEN_LIGHT);
    doc.rect(ML, y, 4, boxH).fill(GREEN_MAIN);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(GREEN_MAIN)
       .text("PATIENT DETAILS", ML + 14, y + 12, { characterSpacing: 1 });
    doc.font("Helvetica-Bold").fontSize(13).fillColor(NAVY)
       .text(`${patientId.firstName} ${patientId.lastName}`, ML + 14, y + 26);
    doc.font("Helvetica").fontSize(9).fillColor(SLATE)
       .text(patientId.email || "", ML + 14, y + 44)
       .text(patientId.phone || "", ML + 14, y + 58);

    // Doctor box
    const dxOff = ML + CW * 0.52;
    doc.roundedRect(dxOff, y, CW * 0.48, boxH, 8).fill(GREEN_LIGHT);
    doc.rect(dxOff, y, 4, boxH).fill(GREEN_MAIN);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(GREEN_MAIN)
       .text("PRESCRIBING DOCTOR", dxOff + 14, y + 12, { characterSpacing: 1 });
    doc.font("Helvetica-Bold").fontSize(13).fillColor(NAVY)
       .text(`Dr. ${doctorId.firstName} ${doctorId.lastName}`, dxOff + 14, y + 26);
    doc.font("Helvetica").fontSize(9).fillColor(SLATE)
       .text(doctorId.specialization || "General Practice", dxOff + 14, y + 44)
       .text(doctorId.email || "", dxOff + 14, y + 58);

    y += boxH + 18;

    // ── Diagnosis ────────────────────────────
    if (diagnosis) {
      doc.roundedRect(ML, y, CW, 38, 6).fill("#f0fdf4");
      doc.rect(ML, y, 4, 38).fill(GREEN_ACC);
      doc.font("Helvetica-Bold").fontSize(8).fillColor(GREEN_MAIN)
         .text("DIAGNOSIS", ML + 14, y + 8, { characterSpacing: 1 });
      doc.font("Helvetica").fontSize(11).fillColor(NAVY)
         .text(diagnosis, ML + 14, y + 20, { width: CW - 28 });
      y += 52;
    }

    // ── Medications Table ─────────────────────
    doc.font("Helvetica-Bold").fontSize(11).fillColor(NAVY)
       .text("Prescribed Medications", ML, y);
    doc.rect(ML, y + 16, 36, 2).fill(GREEN_ACC);
    y += 28;

    const colWidths = [170, 80, 120, 80];  // name, dosage, frequency, duration
    const colX = [ML, ML + 170, ML + 250, ML + 370];
    const rowH = 32;

    // Table header
    doc.rect(ML, y, CW, rowH).fill(GREEN_DEEP);
    const headers = ["Medication", "Dosage", "Frequency", "Duration"];
    headers.forEach((h, i) => {
      doc.font("Helvetica-Bold").fontSize(8).fillColor(WHITE)
         .text(h, colX[i] + 10, y + 11, { width: colWidths[i] - 12, characterSpacing: 1 });
    });
    y += rowH;

    // Table rows
    medications.forEach((med, idx) => {
      const rowBg = idx % 2 === 0 ? WHITE : GREEN_LIGHT;
      doc.rect(ML, y, CW, rowH).fill(rowBg);
      // left border accent on medicine name col
      doc.rect(ML, y, 3, rowH).fill(GREEN_MAIN);

      doc.font("Helvetica-Bold").fontSize(10).fillColor(NAVY)
         .text(med.name, colX[0] + 10, y + 10, { width: colWidths[0] - 12 });
      doc.font("Helvetica").fontSize(10).fillColor(SLATE)
         .text(med.dosage,     colX[1] + 10, y + 10, { width: colWidths[1] - 12 })
         .text(med.frequency,  colX[2] + 10, y + 10, { width: colWidths[2] - 12 });
      doc.font("Helvetica-Bold").fontSize(10).fillColor(GREEN_MAIN)
         .text(med.duration,   colX[3] + 10, y + 10, { width: colWidths[3] - 12 });

      // Row bottom border
      doc.rect(ML, y + rowH - 1, CW, 1).fill(BORDER);
      y += rowH;
    });

    y += 20;

    // ── Clinical Notes ────────────────────────
    if (notes) {
      doc.roundedRect(ML, y, CW, 20, 4).fill(GREEN_LIGHT);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(GREEN_MAIN)
         .text("CLINICAL NOTES", ML + 14, y + 6, { characterSpacing: 1 });
      y += 28;

      const noteLines = doc.heightOfString(notes, { width: CW - 28, fontSize: 10 });
      const noteBoxH = noteLines + 24;
      doc.roundedRect(ML, y, CW, noteBoxH, 6).fill("#f8faf9");
      doc.rect(ML, y, 4, noteBoxH).fill(GREEN_MAIN);
      doc.font("Helvetica-Oblique").fontSize(10).fillColor(NAVY)
         .text(`"${notes}"`, ML + 16, y + 12, { width: CW - 28 });
      y += noteBoxH + 18;
    }

    // ── Important Notice ──────────────────────
    const noticeH = 52;
    doc.roundedRect(ML, y, CW, noticeH, 6).fill("#fffbeb");
    doc.rect(ML, y, 4, noticeH).fill("#f59e0b");
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#92400e")
       .text("IMPORTANT", ML + 14, y + 10, { characterSpacing: 1 });
    doc.font("Helvetica").fontSize(9).fillColor("#78350f")
       .text(
         "Take medicines as directed by your doctor. Do not self-medicate or adjust dosages without consultation. Keep this prescription safe for future reference.",
         ML + 14, y + 24, { width: CW - 28 }
       );
    y += noticeH + 20;

    // ── Doctor Signature area ─────────────────
    const sigBoxW = 180;
    doc.rect(W - MR - sigBoxW, y, sigBoxW, 1).fill(NAVY);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(NAVY)
       .text(`Dr. ${doctorId.firstName} ${doctorId.lastName}`, W - MR - sigBoxW, y + 6, { width: sigBoxW, align: "center" });
    doc.font("Helvetica").fontSize(8).fillColor(MUTED)
       .text(doctorId.specialization || "General Practice", W - MR - sigBoxW, y + 20, { width: sigBoxW, align: "center" })
       .text("Authorised Signature", W - MR - sigBoxW, y + 32, { width: sigBoxW, align: "center" });

    // ── FOOTER ───────────────────────────────
    const footerY = H - 52;
    doc.rect(0, footerY, W, 5).fill(GREEN_ACC);
    doc.rect(0, footerY + 5, W, 47).fill(GREEN_DEEP);
    doc.font("Helvetica-Bold").fontSize(10).fillColor(WHITE)
       .text("SDI Health Care", ML, footerY + 14);
    doc.font("Helvetica").fontSize(8).fillColor("rgba(255,255,255,0.5)")
       .text("Powered by Sunni Dawate Islami  |  Confidential Medical Document", ML, footerY + 28);
    doc.font("Helvetica").fontSize(8).fillColor("rgba(255,255,255,0.5)")
       .text(`Generated: ${new Date().toLocaleString("en-IN")}  |  ${rxId}`,
             0, footerY + 28, { width: W - MR, align: "right" });

    doc.end();
  });
};

// ─────────────────────────────────────────────
// Core Send Function with Logging
// ─────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, type, userId = null, relatedEntityId = null, attachments = [] }) => {
  const startTime = Date.now();
  const from = process.env.SMTP_FROM || '"SDI Health Care" <noreply@sdihealth.com>';

  try {
    const info = await getTransporter().sendMail({ from, to, subject, html, attachments });
    const durationMs = Date.now() - startTime;

    await EmailLog.create({ to, subject, type, userId, relatedEntityId, status: "sent", messageId: info.messageId, durationMs });
    console.log(`✉️  Email [${type}] → ${to} (${durationMs}ms) ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    await EmailLog.create({ to, subject, type, userId, relatedEntityId, status: "failed", error: error.message, durationMs }).catch(() => {});
    console.error(`❌ Email [${type}] FAILED → ${to}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// ─────────────────────────────────────────────
// 1. WELCOME EMAIL
// ─────────────────────────────────────────────
export const sendWelcomeEmail = async (user) => {
  const { email, firstName, role } = user;

  const roleLabel = { patient: "Patient", doctor: "Doctor", admin: "Administrator", staff: "Staff Member" }[role] || role;
  const portalPath = { patient: "/patient/dashboard", doctor: "/doctor/dashboard", admin: "/admin/dashboard", staff: "/staff/dashboard" }[role] || "/";

  const html = layout(`
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:72px;height:72px;background:${BRAND.greenLight};border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:32px;">🎉</span>
      </div>
      ${badge("Welcome to SDI Health Care", BRAND.green)}
    </div>

    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:16px;color:${BRAND.green};font-weight:700;letter-spacing:1px;">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</span>
    </div>

    ${salam(firstName)}

    <p style="color:${BRAND.slateText};font-size:15px;line-height:1.7;margin:0 0 4px;">
      Your account has been successfully created at <strong>SDI Health Care</strong>.
      You are now registered as a <strong>${roleLabel}</strong>. <em>Alhamdulillah!</em>
    </p>

    ${infoBox([
      ["Account Role", roleLabel],
      ["Email", email],
      ["Status", "✅ Active"],
      ["Joined", new Date().toLocaleDateString("en-IN", { dateStyle: "long" })],
    ])}

    <p style="color:${BRAND.slateText};font-size:14px;line-height:1.7;">
      You can now access your personalised dashboard to manage health records, appointments, prescriptions, and more. <em>InshAllah.</em>
    </p>

    ${ctaButton("Access Your Dashboard →", `${BRAND.portalUrl}${portalPath}`, BRAND.green)}
  `);

  return sendEmail({ to: email, subject: "Welcome to SDI Health Care 🏥", html, type: "welcome", userId: user._id });
};

// ─────────────────────────────────────────────
// 2. APPOINTMENT BOOKED
// ─────────────────────────────────────────────
export const sendAppointmentBookedEmail = async (appointment) => {
  const { patientId, doctorId, date, timeSlot, reason, _id, consultationFee } = appointment;
  const appointmentDate = new Date(date).toLocaleDateString("en-IN", { dateStyle: "full" });
  const aptId = `APT-${_id.toString().slice(-8).toUpperCase()}`;

  const patientHtml = layout(`
    ${badge("Appointment Booked", "#2563eb")}
    ${salam(patientId.firstName)}

    <p style="color:${BRAND.slateText};font-size:15px;line-height:1.7;margin:0;">
      <em>InshAllah</em>, your appointment has been successfully booked with
      <strong>Dr. ${doctorId.firstName} ${doctorId.lastName}</strong>.
    </p>

    ${infoBox([
      ["Appointment ID", aptId],
      ["Doctor", `Dr. ${doctorId.firstName} ${doctorId.lastName}`],
      ["Specialization", doctorId.specialization || "General Practice"],
      ["Date", appointmentDate],
      ["Time Slot", timeSlot],
      ["Reason", reason || "General Consultation"],
      ["Fee", `₹${consultationFee || "N/A"}`],
      ["Status", "⏳ Pending Confirmation"],
    ])}

    ${alertBox("⚠️ Please arrive <strong>10 minutes early</strong> and bring any previous medical records or reports.", "warning")}

    ${ctaButton("View Appointment →", `${BRAND.portalUrl}/patient/appointments`, "#2563eb")}
  `);

  const doctorHtml = layout(`
    ${badge("New Appointment Request", "#7c3aed")}
    ${salam(`Dr. ${doctorId.firstName}`)}

    <p style="color:${BRAND.slateText};font-size:15px;line-height:1.7;margin:0;">
      <em>MashAllah</em>, a new appointment request has been received from
      <strong>${patientId.firstName} ${patientId.lastName}</strong>.
    </p>

    ${infoBox([
      ["Appointment ID", aptId],
      ["Patient", `${patientId.firstName} ${patientId.lastName}`],
      ["Patient Email", patientId.email],
      ["Date", appointmentDate],
      ["Time Slot", timeSlot],
      ["Reason", reason || "General Consultation"],
      ["Status", "⏳ Awaiting Your Confirmation"],
    ])}

    ${ctaButton("View & Confirm Schedule →", `${BRAND.portalUrl}/doctor/appointments`, "#7c3aed")}
  `);

  return Promise.allSettled([
    sendEmail({ to: patientId.email, subject: `Appointment Booked — ${aptId}`, html: patientHtml, type: "appointment_booked", userId: patientId._id, relatedEntityId: _id }),
    sendEmail({ to: doctorId.email, subject: `New Appointment Request — ${appointmentDate}`, html: doctorHtml, type: "appointment_booked", userId: doctorId._id, relatedEntityId: _id }),
  ]);
};

// ─────────────────────────────────────────────
// 3. APPOINTMENT CONFIRMED
// ─────────────────────────────────────────────
export const sendAppointmentConfirmedEmail = async (appointment) => {
  const { patientId, doctorId, date, timeSlot, _id } = appointment;
  const appointmentDate = new Date(date).toLocaleDateString("en-IN", { dateStyle: "full" });
  const aptId = `APT-${_id.toString().slice(-8).toUpperCase()}`;

  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;background:#f0fdf4;border:3px solid ${BRAND.greenAccent};border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:28px;">✅</span>
      </div>
      ${badge("Appointment Confirmed", BRAND.green)}
    </div>

    ${salam(patientId.firstName)}

    <p style="color:${BRAND.slateText};font-size:15px;line-height:1.7;margin:0;">
      <em>Alhamdulillah!</em> Dr. <strong>${doctorId.firstName} ${doctorId.lastName}</strong> has
      confirmed your appointment. Please be on time. <em>JazakAllah Khair!</em>
    </p>

    ${infoBox([
      ["Appointment ID", aptId],
      ["Doctor", `Dr. ${doctorId.firstName} ${doctorId.lastName}`],
      ["Date", appointmentDate],
      ["Time Slot", timeSlot],
      ["Status", `<span style="color:${BRAND.green};font-weight:700;">✅ Confirmed</span>`],
    ])}

    ${alertBox("📌 Bring a valid ID and any previous prescriptions or test reports to your appointment.", "success")}

    ${ctaButton("View Appointment Details →", `${BRAND.portalUrl}/patient/appointments`, BRAND.green)}
  `);

  return sendEmail({ to: patientId.email, subject: `✅ Appointment Confirmed — ${appointmentDate}`, html, type: "appointment_confirmed", userId: patientId._id, relatedEntityId: _id });
};

// ─────────────────────────────────────────────
// 4. APPOINTMENT CANCELLED
// ─────────────────────────────────────────────
export const sendAppointmentCancelledEmail = async (appointment, cancelledBy = "system") => {
  const { patientId, doctorId, date, timeSlot, _id, cancellationReason } = appointment;
  const appointmentDate = new Date(date).toLocaleDateString("en-IN", { dateStyle: "full" });
  const aptId = `APT-${_id.toString().slice(-8).toUpperCase()}`;

  const makeHtml = (recipientName) => layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;background:#fef2f2;border:3px solid #dc2626;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:28px;">❌</span>
      </div>
      ${badge("Appointment Cancelled", "#dc2626")}
    </div>

    ${salam(recipientName)}

    <p style="color:${BRAND.slateText};font-size:15px;line-height:1.7;margin:0;">
      We regret to inform you that the following appointment has been <strong>cancelled</strong>.
    </p>

    ${infoBox([
      ["Appointment ID", aptId],
      ["Date", appointmentDate],
      ["Time Slot", timeSlot],
      ["Cancelled By", cancelledBy],
      ["Reason", cancellationReason || "No reason provided"],
    ])}

    ${alertBox("If you believe this was a mistake, please contact the hospital or book a new appointment through the portal.", "danger")}

    ${ctaButton("Book New Appointment →", `${BRAND.portalUrl}/patient/appointments`, "#dc2626")}
  `);

  return Promise.allSettled([
    sendEmail({ to: patientId.email, subject: `❌ Appointment Cancelled — ${aptId}`, html: makeHtml(patientId.firstName), type: "appointment_cancelled", userId: patientId._id, relatedEntityId: _id }),
    sendEmail({ to: doctorId.email, subject: `Appointment Cancelled — ${appointmentDate}`, html: makeHtml(`Dr. ${doctorId.firstName}`), type: "appointment_cancelled", userId: doctorId._id, relatedEntityId: _id }),
  ]);
};

// ─────────────────────────────────────────────
// 5. PRESCRIPTION EMAIL
// ─────────────────────────────────────────────
export const sendPrescriptionEmail = async (prescription) => {
  const { patientId, doctorId, medications, notes, diagnosis, createdDate, _id } = prescription;
  const rxId = `RX-${_id.toString().slice(-8).toUpperCase()}`;

  const html = layout(`
    ${badge("Digital Prescription Issued", BRAND.navy)}
    ${salam(patientId.firstName)}

    <p style="color:${BRAND.slateText};font-size:15px;line-height:1.7;margin:0;">
      <em>InshAllah</em>, a new digital prescription has been issued for you by
      <strong>Dr. ${doctorId.firstName} ${doctorId.lastName}</strong>.
    </p>

    ${infoBox([
      ["Prescription ID", rxId],
      ["Doctor", `Dr. ${doctorId.firstName} ${doctorId.lastName}`],
      ["Diagnosis", diagnosis || "See medications below"],
      ["Issued On", new Date(createdDate || Date.now()).toLocaleDateString("en-IN", { dateStyle: "long" })],
    ])}

    ${sectionHead("Prescribed Medications", "💊")}

    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
           style="border-collapse:separate;border-spacing:0;border:1px solid ${BRAND.border};border-radius:12px;overflow:hidden;">
      <thead>
        <tr style="background:${BRAND.greenDeep};">
          <th style="padding:11px 16px;text-align:left;font-size:10px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Medication</th>
          <th style="padding:11px 16px;text-align:left;font-size:10px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Dosage</th>
          <th style="padding:11px 16px;text-align:left;font-size:10px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Frequency</th>
          <th style="padding:11px 16px;text-align:left;font-size:10px;color:rgba(255,255,255,0.8);text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">Duration</th>
        </tr>
      </thead>
      <tbody>
        ${medications.map((med, i) => `
          <tr style="background:${i % 2 === 0 ? BRAND.white : BRAND.offWhite};">
            <td style="padding:12px 16px;font-size:14px;font-weight:700;color:${BRAND.navy};border-bottom:1px solid ${BRAND.border};">${med.name}</td>
            <td style="padding:12px 16px;font-size:13px;color:${BRAND.slateText};border-bottom:1px solid ${BRAND.border};">${med.dosage}</td>
            <td style="padding:12px 16px;font-size:13px;color:${BRAND.slateText};border-bottom:1px solid ${BRAND.border};">${med.frequency}</td>
            <td style="padding:12px 16px;font-size:13px;color:${BRAND.green};font-weight:700;border-bottom:1px solid ${BRAND.border};">${med.duration}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>

    ${notes ? `
      ${sectionHead("Clinical Notes", "📋")}
      <div style="background:${BRAND.greenLight};border:1px solid ${BRAND.border};border-radius:10px;padding:18px 22px;">
        <p style="margin:0;font-size:14px;color:${BRAND.navy};line-height:1.7;font-style:italic;">"${notes}"</p>
      </div>
    ` : ""}

    <p style="color:${BRAND.mutedText};font-size:13px;margin-top:24px;">
      Your prescription PDF is attached to this email. You can also view and download it from your patient portal.
    </p>

    ${ctaButton("View & Download Prescription →", `${BRAND.portalUrl}/patient/prescriptions`, BRAND.green)}
  `);

  // Generate the branded PDF and attach it
  let attachments = [];
  try {
    const pdfBuffer = await generatePrescriptionPDF(prescription);
    attachments = [{
      filename: `Prescription-${rxId}.pdf`,
      content:  pdfBuffer,
      contentType: "application/pdf",
    }];
    console.log(`📄 Prescription PDF generated (${(pdfBuffer.length / 1024).toFixed(1)} KB) — ${rxId}`);
  } catch (pdfErr) {
    console.error(`⚠️  PDF generation failed for ${rxId}: ${pdfErr.message}`);
    // Email still sends without attachment if PDF generation fails
  }

  return sendEmail({
    to: patientId.email,
    subject: `Digital Prescription: ${rxId}`,
    html,
    type: "prescription",
    userId: patientId._id,
    relatedEntityId: _id,
    attachments,
  });
};

// ─────────────────────────────────────────────
// 6. LOGIN ALERT
// ─────────────────────────────────────────────
export const sendLoginAlertEmail = async (user, deviceInfo, ipAddress) => {
  const { email, firstName, _id } = user;

  const html = layout(`
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:64px;height:64px;background:#fffbeb;border:3px solid #f59e0b;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:28px;">🔒</span>
      </div>
      ${badge("New Login Detected", "#d97706")}
    </div>

    ${salam(firstName)}

    <p style="color:${BRAND.slateText};font-size:15px;line-height:1.7;margin:0;">
      A new login to your SDI Health Care account was detected.
      If this was you, <em>Alhamdulillah</em> — no action needed.
    </p>

    ${infoBox([
      ["Time", new Date().toLocaleString("en-IN")],
      ["IP Address", ipAddress || "Unknown"],
      ["Device", deviceInfo?.device || "Unknown"],
      ["Browser", deviceInfo?.browser || "Unknown"],
      ["OS", deviceInfo?.os || "Unknown"],
    ])}

    ${alertBox("⚠️ If you did <strong>NOT</strong> perform this login, please contact support immediately and change your password.", "warning")}

    ${ctaButton("Manage Account Security →", `${BRAND.portalUrl}/settings/security`, "#d97706")}
  `, "If this login was not performed by you, contact our support team immediately.");

  return sendEmail({ to: email, subject: "🔒 New Login Detected — SDI Health Care", html, type: "login_alert", userId: _id });
};

// ─────────────────────────────────────────────
// 7. HAPPY BIRTHDAY
// ─────────────────────────────────────────────
export const sendBirthdayEmail = async (user, { senderName = "SDI Health Care Team", customMessage = "" } = {}) => {
  const { email, firstName, _id } = user;

  const html = layout(`
    <!-- Birthday banner -->
    <div style="background:linear-gradient(135deg,#7c3aed,#db2777,#ea580c);border-radius:16px;padding:36px 32px;text-align:center;margin-bottom:28px;">
      <div style="font-size:52px;margin-bottom:10px;">🎂</div>
      <h1 style="color:#ffffff;margin:0;font-size:30px;font-weight:900;letter-spacing:1px;">Happy Birthday!</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0;">Wishing you the very best on your special day</p>
    </div>

    ${salam(firstName)}

    <div style="background:${BRAND.greenLight};border:1px solid ${BRAND.border};border-radius:14px;padding:28px;text-align:center;margin-bottom:24px;">
      <p style="color:${BRAND.navy};font-size:16px;line-height:1.8;margin:0;">
        On your special day, the entire <strong>SDI Health Care</strong> family wishes you
        <strong>good health, happiness, and endless joy</strong>.
        May this year bring you wonderful moments and beautiful memories! 🌟
      </p>
    </div>

    <table width="100%" cellpadding="8" cellspacing="0" role="presentation">
      <tr>
        <td width="33%" style="padding:6px;">
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:28px;">🌟</div>
            <div style="font-size:12px;color:#9a3412;font-weight:700;margin-top:8px;">Good Health</div>
          </div>
        </td>
        <td width="33%" style="padding:6px;">
          <div style="background:#fdf2f8;border:1px solid #f9a8d4;border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:28px;">😊</div>
            <div style="font-size:12px;color:#9d174d;font-weight:700;margin-top:8px;">Happiness</div>
          </div>
        </td>
        <td width="33%" style="padding:6px;">
          <div style="background:${BRAND.greenLight};border:1px solid ${BRAND.border};border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:28px;">🎊</div>
            <div style="font-size:12px;color:${BRAND.greenDark};font-weight:700;margin-top:8px;">Prosperity</div>
          </div>
        </td>
      </tr>
    </table>

    ${customMessage ? `
      <div style="border-left:4px solid #f59e0b;background:#fffbeb;padding:20px 24px;border-radius:0 12px 12px 0;margin-top:24px;">
        <div style="font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">💌 A Personal Message</div>
        <p style="color:#78350f;font-size:14px;line-height:1.7;margin:0 0 10px;font-style:italic;">"${customMessage}"</p>
        <div style="font-size:12px;color:#b45309;font-weight:700;">— ${senderName}</div>
      </div>
    ` : ""}

    ${ctaButton("🎁 Visit Your Health Portal", BRAND.portalUrl, "#db2777")}
  `, "This birthday message was sent by SDI Health Care. We care about your wellbeing!");

  return sendEmail({ to: email, subject: `🎂 Happy Birthday, ${firstName}! — SDI Health Care`, html, type: "custom", userId: _id });
};

// ─────────────────────────────────────────────
// 8. EID MUBARAK
// ─────────────────────────────────────────────
export const sendEidEmail = async (user, { eidType = "Eid ul-Fitr", senderName = "SDI Health Care Team", customMessage = "" } = {}) => {
  const { email, firstName, _id } = user;
  const isEidAdha = eidType.toLowerCase().includes("adha");
  const emoji = isEidAdha ? "🐑" : "🌙";
  const gradient = isEidAdha ? "linear-gradient(135deg,#064e3b,#065f46,#047857)" : "linear-gradient(135deg,#1e1b4b,#312e81,#1e3a8a)";
  const accentColor = isEidAdha ? BRAND.green : "#4f46e5";

  const html = layout(`
    <div style="background:${gradient};border-radius:16px;padding:36px 32px;text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:10px;">${emoji} ☪️ ${emoji}</div>
      <h1 style="color:#ffffff;margin:0;font-size:30px;font-weight:900;">${eidType} Mubarak!</h1>
      <div style="color:rgba(255,255,255,0.65);font-size:20px;margin-top:8px;font-family:Georgia,serif;">عيد مبارك</div>
    </div>

    ${salam(firstName)}

    <p style="color:${BRAND.slateText};font-size:15px;line-height:1.7;margin:0 0 24px;">
      May this blessed <strong>${eidType}</strong> bring you and your family
      peace, joy, good health, and Allah's infinite mercy. <em>Ameen.</em>
    </p>

    <table width="100%" cellpadding="6" cellspacing="0" role="presentation">
      <tr>
        <td width="50%" style="padding:6px;">
          <div style="background:${BRAND.greenLight};border:1px solid ${BRAND.border};border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:28px;">🤲</div>
            <div style="font-size:12px;color:${BRAND.greenDark};font-weight:700;margin-top:8px;">Peace & Blessings</div>
          </div>
        </td>
        <td width="50%" style="padding:6px;">
          <div style="background:#fefce8;border:1px solid #fef08a;border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:28px;">❤️</div>
            <div style="font-size:12px;color:#713f12;font-weight:700;margin-top:8px;">Joy & Happiness</div>
          </div>
        </td>
      </tr>
      <tr>
        <td width="50%" style="padding:6px;">
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:28px;">💚</div>
            <div style="font-size:12px;color:#064e3b;font-weight:700;margin-top:8px;">Health & Wellness</div>
          </div>
        </td>
        <td width="50%" style="padding:6px;">
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:20px;text-align:center;">
            <div style="font-size:28px;">🌟</div>
            <div style="font-size:12px;color:#1e3a8a;font-weight:700;margin-top:8px;">Prosperity</div>
          </div>
        </td>
      </tr>
    </table>

    ${customMessage ? `
      <div style="border-left:4px solid ${accentColor};background:${BRAND.greenLight};padding:20px 24px;border-radius:0 12px 12px 0;margin-top:24px;">
        <div style="font-size:10px;font-weight:700;color:${accentColor};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px;">💌 Personal Message</div>
        <p style="color:${BRAND.navy};font-size:14px;line-height:1.7;margin:0 0 10px;font-style:italic;">"${customMessage}"</p>
        <div style="font-size:12px;color:${BRAND.mutedText};font-weight:700;">— ${senderName}</div>
      </div>
    ` : ""}

    ${ctaButton(`Celebrate with Good Health →`, BRAND.portalUrl, accentColor)}
  `, `This ${eidType} greeting was sent by SDI Health Care.`);

  return sendEmail({ to: email, subject: `${emoji} ${eidType} Mubarak, ${firstName}! — SDI Health Care`, html, type: "custom", userId: _id });
};

// ─────────────────────────────────────────────
// 9. CUSTOM MESSAGE EMAIL
// ─────────────────────────────────────────────
export const sendCustomMessageEmail = async (user, {
  subject, title, message,
  senderName = "SDI Health Care Team",
  senderRole = "Administrator",
  ctaText = null, ctaUrl = null,
  badgeText = "Message from SDI Health Care",
  badgeColor = BRAND.green,
  emoji = "💬",
} = {}) => {
  const { email, firstName, _id } = user;

  const html = layout(`
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:${BRAND.greenLight};border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:28px;">${emoji}</span>
      </div>
      ${badge(badgeText, badgeColor)}
    </div>

    ${salam(firstName)}

    <div style="background:${BRAND.offWhite};border:1px solid ${BRAND.border};border-radius:14px;padding:28px 32px;margin:20px 0;">
      ${title ? `<h3 style="color:${BRAND.navy};margin:0 0 16px;font-size:18px;font-weight:800;">${title}</h3>` : ""}
      <p style="color:${BRAND.slateText};font-size:15px;line-height:1.8;margin:0;white-space:pre-line;">${message}</p>
    </div>

    <div style="background:${BRAND.greenLight};border:1px solid ${BRAND.border};border-radius:10px;padding:16px 20px;margin-top:20px;">
      <div style="font-size:13px;font-weight:700;color:${BRAND.green};">${senderName}</div>
      <div style="font-size:12px;color:${BRAND.mutedText};margin-top:2px;">${senderRole} · SDI Health Care</div>
    </div>

    ${ctaText && ctaUrl ? ctaButton(ctaText, ctaUrl, badgeColor) : ""}
  `);

  return sendEmail({ to: email, subject: subject || `A message from ${senderName} — SDI Health Care`, html, type: "custom", userId: _id });
};

// ─────────────────────────────────────────────
// 10. RAMADAN MUBARAK
// ─────────────────────────────────────────────
export const sendRamadanEmail = async (user, { senderName = "SDI Health Care Team", customMessage = "" } = {}) => {
  const { email, firstName, _id } = user;

  const html = layout(`
    <div style="background:linear-gradient(135deg,#0f0a2e 0%,#1a1040 50%,#0f2a4a 100%);border-radius:16px;padding:36px 32px;text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:10px;">🌙 ✨ 🕌</div>
      <h1 style="color:#fbbf24;margin:0;font-size:28px;font-weight:900;">Ramadan Mubarak!</h1>
      <div style="color:rgba(251,191,36,0.75);font-size:22px;margin-top:8px;font-family:Georgia,serif;">رَمَضَان مُبَارَك</div>
      <p style="color:rgba(255,255,255,0.5);font-size:12px;margin:8px 0 0;">May Allah accept your fasts and prayers</p>
    </div>

    ${salam(firstName)}

    <div style="background:${BRAND.greenLight};border:1px solid ${BRAND.border};border-radius:14px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="color:${BRAND.navy};font-size:15px;line-height:1.8;margin:0;">
        The blessed month of <strong>Ramadan</strong> has arrived. The entire SDI Health Care family
        wishes you a month filled with <strong>barakah, forgiveness, and mercy</strong>.
        May Allah accept all your ibadah. <em>Ameen.</em>
      </p>
    </div>

    <table width="100%" cellpadding="6" cellspacing="0" role="presentation">
      <tr>
        <td width="33%" style="padding:6px;">
          <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:24px;">🤲</div>
            <div style="font-size:12px;color:#92400e;font-weight:700;margin-top:6px;">Du'a</div>
            <div style="font-size:10px;color:#b45309;margin-top:2px;">Prayers accepted</div>
          </div>
        </td>
        <td width="33%" style="padding:6px;">
          <div style="background:${BRAND.greenLight};border:1px solid ${BRAND.border};border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:24px;">📖</div>
            <div style="font-size:12px;color:${BRAND.greenDark};font-weight:700;margin-top:6px;">Quran</div>
            <div style="font-size:10px;color:${BRAND.green};margin-top:2px;">Month of Quran</div>
          </div>
        </td>
        <td width="33%" style="padding:6px;">
          <div style="background:#ede9fe;border:1px solid #ddd6fe;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:24px;">🌙</div>
            <div style="font-size:12px;color:#4c1d95;font-weight:700;margin-top:6px;">Sawm</div>
            <div style="font-size:10px;color:#6d28d9;margin-top:2px;">Blessed fasting</div>
          </div>
        </td>
      </tr>
    </table>

    <div style="background:${BRAND.offWhite};border:1px solid ${BRAND.border};border-radius:12px;padding:20px;text-align:center;margin-top:24px;">
      <div style="font-size:15px;color:#4c1d95;font-family:Georgia,serif;margin-bottom:8px;">"شَهْرُ رَمَضَانَ الَّذِي أُنزِلَ فِيهِ الْقُرْآنُ"</div>
      <div style="font-size:11px;color:${BRAND.mutedText};font-style:italic;">"The month of Ramadan in which was revealed the Quran" — Al-Baqarah 2:185</div>
    </div>

    ${customMessage ? `
      <div style="border-left:4px solid #fbbf24;background:#fffbeb;padding:18px 20px;border-radius:0 10px 10px 0;margin-top:20px;">
        <div style="font-size:10px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">💌 Personal Message</div>
        <p style="color:#78350f;font-size:14px;line-height:1.7;margin:0 0 10px;font-style:italic;">"${customMessage}"</p>
        <div style="font-size:12px;color:#b45309;font-weight:700;">— ${senderName}</div>
      </div>
    ` : ""}

    ${ctaButton("Visit Your Health Portal →", BRAND.portalUrl, "#7c3aed")}
  `, "This Ramadan greeting was sent by SDI Health Care. We pray for your health and barakah.");

  return sendEmail({ to: email, subject: `🌙 Ramadan Mubarak, ${firstName}! — SDI Health Care`, html, type: "custom", userId: _id });
};

// ─────────────────────────────────────────────
// 11. JUMMA MUBARAK
// ─────────────────────────────────────────────
export const sendJummaEmail = async (user, { senderName = "SDI Health Care Team", customMessage = "" } = {}) => {
  const { email, firstName, _id } = user;

  const html = layout(`
    <div style="background:linear-gradient(135deg,${BRAND.greenDeep} 0%,${BRAND.greenDark} 100%);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
      <div style="font-size:48px;margin-bottom:8px;">🕌</div>
      <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:900;">Jumma Mubarak!</h1>
      <div style="color:rgba(167,243,208,0.85);font-size:20px;margin-top:8px;font-family:Georgia,serif;">جُمُعَة مُبَارَك</div>
    </div>

    ${salam(firstName)}

    <div style="background:${BRAND.greenLight};border:1px solid ${BRAND.border};border-radius:14px;padding:24px;margin-bottom:20px;text-align:center;">
      <p style="color:${BRAND.navy};font-size:15px;line-height:1.8;margin:0;">
        Wishing you and your loved ones a blessed <strong>Jumu'ah</strong>.
        May Allah accept your prayers, forgive your sins, and shower His
        infinite mercy upon you and your family. <em>Ameen.</em>
      </p>
    </div>

    <div style="background:${BRAND.offWhite};border:1px solid ${BRAND.border};border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
      <div style="font-size:14px;color:${BRAND.green};font-family:Georgia,serif;margin-bottom:8px;">
        "يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ"
      </div>
      <div style="font-size:11px;color:${BRAND.mutedText};font-style:italic;">
        "O you who believe! When the call is proclaimed for the prayer on Friday..." — Al-Jumu'ah 62:9
      </div>
    </div>

    ${customMessage ? `
      <div style="border-left:4px solid ${BRAND.green};background:${BRAND.greenLight};padding:18px 20px;border-radius:0 10px 10px 0;margin-bottom:20px;">
        <div style="font-size:10px;font-weight:700;color:${BRAND.greenDark};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">💌 Message</div>
        <p style="color:${BRAND.navy};font-size:14px;line-height:1.7;margin:0 0 10px;font-style:italic;">"${customMessage}"</p>
        <div style="font-size:12px;color:${BRAND.green};font-weight:700;">— ${senderName}</div>
      </div>
    ` : ""}

    <div style="text-align:center;margin-top:20px;padding:16px;background:${BRAND.greenLight};border-radius:10px;">
      <div style="font-size:14px;font-weight:800;color:${BRAND.navy};">🏥 SDI Health Care</div>
      <p style="color:${BRAND.mutedText};font-size:12px;margin:4px 0 0;"><em>JazakAllah Khair for trusting us with your health.</em></p>
    </div>

    ${ctaButton("Visit Your Health Portal →", BRAND.portalUrl, BRAND.green)}
  `);

  return sendEmail({ to: email, subject: `🕌 Jumma Mubarak, ${firstName}! — SDI Health Care`, html, type: "custom", userId: _id });
};

// ─────────────────────────────────────────────
// 12. ISLAMIC NEW YEAR
// ─────────────────────────────────────────────
export const sendIslamicNewYearEmail = async (user, { senderName = "SDI Health Care Team", customMessage = "", hijriYear = "" } = {}) => {
  const { email, firstName, _id } = user;
  const yearText = hijriYear || `${new Date().getFullYear()} AH`;

  const html = layout(`
    <div style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 55%,#1e3a5c 100%);border-radius:16px;padding:36px 32px;text-align:center;margin-bottom:28px;">
      <div style="font-size:48px;margin-bottom:10px;">🌙 ⭐ 🕌</div>
      <h1 style="color:#e0e7ff;margin:0;font-size:26px;font-weight:900;">Islamic New Year Mubarak!</h1>
      <div style="color:#a5b4fc;font-size:20px;margin-top:10px;font-family:Georgia,serif;">رَأْسُ السَّنَةِ الْهِجْرِيَّةِ</div>
      <div style="color:rgba(165,180,252,0.6);font-size:12px;margin-top:6px;">${yearText}</div>
    </div>

    ${salam(firstName)}

    <div style="background:${BRAND.greenLight};border:1px solid ${BRAND.border};border-radius:14px;padding:24px;margin-bottom:24px;text-align:center;">
      <p style="color:${BRAND.navy};font-size:15px;line-height:1.8;margin:0;">
        As we begin a new year in the <strong>Islamic Hijri Calendar</strong>,
        the SDI Health Care family prays that Allah blesses you with
        <strong>good health, peace, and prosperity</strong> in the coming year.
        May each new day bring you closer to Allah. <em>Ameen.</em>
      </p>
    </div>

    <table width="100%" cellpadding="6" cellspacing="0" role="presentation">
      <tr>
        <td width="50%" style="padding:6px;">
          <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:28px;">🌟</div>
            <div style="font-size:12px;color:#3730a3;font-weight:700;margin-top:6px;">New Beginnings</div>
          </div>
        </td>
        <td width="50%" style="padding:6px;">
          <div style="background:${BRAND.greenLight};border:1px solid ${BRAND.border};border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:28px;">🤲</div>
            <div style="font-size:12px;color:${BRAND.greenDark};font-weight:700;margin-top:6px;">Du'a & Barakah</div>
          </div>
        </td>
      </tr>
    </table>

    ${customMessage ? `
      <div style="border-left:4px solid #6366f1;background:#eef2ff;padding:18px 20px;border-radius:0 10px 10px 0;margin-top:20px;">
        <div style="font-size:10px;font-weight:700;color:#3730a3;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:6px;">💌 Message</div>
        <p style="color:#312e81;font-size:14px;line-height:1.7;margin:0 0 10px;font-style:italic;">"${customMessage}"</p>
        <div style="font-size:12px;color:#6366f1;font-weight:700;">— ${senderName}</div>
      </div>
    ` : ""}

    <div style="text-align:center;margin-top:28px;padding:16px;background:${BRAND.greenLight};border-radius:10px;">
      <div style="font-size:15px;font-weight:800;color:${BRAND.navy};">🏥 SDI Health Care</div>
      <p style="color:${BRAND.mutedText};font-size:12px;margin:4px 0 0;"><em>Your health, our amanah. Always.</em></p>
    </div>

    ${ctaButton("Visit Your Health Portal →", BRAND.portalUrl, "#4f46e5")}
  `);

  return sendEmail({ to: email, subject: `🌙 Islamic New Year Mubarak, ${firstName}! — SDI Health Care`, html, type: "custom", userId: _id });
};

// ─────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────
export default {
  sendWelcomeEmail,
  sendAppointmentBookedEmail,
  sendAppointmentConfirmedEmail,
  sendAppointmentCancelledEmail,
  sendPrescriptionEmail,
  sendLoginAlertEmail,
  sendBirthdayEmail,
  sendEidEmail,
  sendCustomMessageEmail,
  sendRamadanEmail,
  sendJummaEmail,
  sendIslamicNewYearEmail,
};