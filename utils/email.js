import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Configure Transporter
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: process.env.SMTP_PORT || 2525,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

/**
 * Send Professional Prescription Email
 * @param {Object} prescription - Populated prescription object
 */
export const sendPrescriptionEmail = async (prescription) => {
  const { patientId, doctorId, medications, notes, createdDate, _id } = prescription;
  
  const mailOptions = {
    from: `"SDI Health Care" <${process.env.SMTP_FROM || 'noreply@sdihealth.com'}>`,
    to: patientId.email,
    subject: `Digital Prescription Issued: RX-${_id.slice(-8).toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background-color: #0f172a; padding: 30px; color: white;">
          <h1 style="margin: 0; font-size: 24px;">SDI HEALTH CARE</h1>
          <p style="margin: 5px 0 0; color: #94a3b8; font-size: 12px; letter-spacing: 2px;">OFFICIAL PHARMACY DIRECTIVE</p>
        </div>
        
        <div style="padding: 40px;">
          <h2 style="margin-top: 0;">Hello ${patientId.firstName},</h2>
          <p>A new digital prescription has been issued for you by <strong>Dr. ${doctorId.firstName} ${doctorId.lastName}</strong>.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="margin-top: 0; font-size: 12px; color: #64748b; font-weight: bold; text-transform: uppercase;">Reference Details</p>
            <p style="margin: 5px 0;"><strong>ID:</strong> RX-${_id.slice(-8).toUpperCase()}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(createdDate).toLocaleDateString()}</p>
          </div>

          <h3 style="border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 20px;">Prescribed Medications</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="text-align: left; font-size: 12px; color: #94a3b8; text-transform: uppercase;">
                <th style="padding-bottom: 10px;">Medication</th>
                <th style="padding-bottom: 10px;">Dosage</th>
                <th style="padding-bottom: 10px;">Duration</th>
              </tr>
            </thead>
            <tbody>
              ${medications.map(med => `
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 15px 0;"><strong>${med.name}</strong></td>
                  <td style="padding: 15px 0;">${med.dosage} (${med.frequency})</td>
                  <td style="padding: 15px 0; color: #15803d;">${med.duration}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          ${notes ? `
            <div style="margin-top: 30px;">
              <h3 style="font-size: 14px; margin-bottom: 10px;">Clinical Instructions</h3>
              <div style="padding: 20px; border-left: 4px solid #22c55e; background-color: #f0fdf4; font-style: italic;">
                "${notes}"
              </div>
            </div>
          ` : ''}

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
            <p style="font-size: 12px; color: #64748b;">You can download your full professional PDF report with the doctor's digital signature from your patient portal.</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/patient/prescriptions" style="display: inline-block; background-color: #0f172a; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">Access Patient Portal</a>
          </div>
        </div>
        
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} SDI Health Care System. Confidential medical information.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Prescription Email Sent: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending prescription email:", error);
    // Don't throw, just log. We don't want to fail the whole request if email fails.
    return false;
  }
};

export default { sendPrescriptionEmail };
