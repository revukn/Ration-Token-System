import nodemailer from "nodemailer";
import { logger } from "./logger";

let transporter: nodemailer.Transporter | null = null;
let testAccount: { user: string; pass: string } | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  ) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    logger.info("Email transporter created with SMTP config");
  } else {
    testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info({ user: testAccount.user }, "Email transporter created with Ethereal test account");
  }

  return transporter;
}

export async function sendOtpEmail(toEmail: string, otp: string) {
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: `"E-Ration Token System" <noreply@eration.karnataka.gov.in>`,
      to: toEmail,
      subject: "Your Aadhaar Verification OTP - E-Ration System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="background: #e65c00; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0;">Government of Karnataka</h2>
            <p style="color: #ffe0cc; margin: 4px 0 0;">E-Ration Token System</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
            <h3 style="color: #1a1a2e;">Aadhaar Verification OTP</h3>
            <p style="color: #555;">Your One-Time Password for Aadhaar-based verification is:</p>
            <div style="background: #fff3e0; border: 2px dashed #e65c00; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #e65c00;">${otp}</span>
            </div>
            <p style="color: #888; font-size: 13px;">This OTP is valid for 10 minutes. Do not share it with anyone.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #aaa; font-size: 12px; text-align: center;">
              Karnataka State Government — E-Ration Administration<br/>
              This is an automated message. Please do not reply.
            </p>
          </div>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info({ previewUrl }, "OTP email preview (Ethereal test account)");
    }
    logger.info({ to: toEmail, messageId: info.messageId }, "OTP email sent");
    return { success: true, previewUrl: previewUrl || null };
  } catch (err) {
    logger.error({ err }, "Failed to send OTP email");
    return { success: false, previewUrl: null };
  }
}

export async function sendTokenConfirmationEmail(
  toEmail: string,
  userName: string,
  tokenNumber: string,
  rationCardNumber: string,
  members: string[],
  verificationType: string,
) {
  try {
    const transport = await getTransporter();
    const info = await transport.sendMail({
      from: `"E-Ration Token System" <noreply@eration.karnataka.gov.in>`,
      to: toEmail,
      subject: `Ration Token Generated: ${tokenNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 8px;">
          <div style="background: #e65c00; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h2 style="color: white; margin: 0;">Government of Karnataka</h2>
            <p style="color: #ffe0cc; margin: 4px 0 0;">E-Ration Token System</p>
          </div>
          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #ddd;">
            <h3 style="color: #1a1a2e;">Ration Token Generated Successfully</h3>
            <p style="color: #555;">Dear <strong>${userName}</strong>,</p>
            <p style="color: #555;">Your ration token has been generated. Please carry this token number to the ration shop.</p>
            
            <div style="background: #fff3e0; border-left: 4px solid #e65c00; border-radius: 4px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="margin-bottom: 10px;">
                  <td style="color: #888; font-size: 13px; padding: 6px 0; width: 40%;">Token Number:</td>
                  <td style="color: #1a1a2e; font-weight: bold; font-size: 16px;">${tokenNumber}</td>
                </tr>
                <tr>
                  <td style="color: #888; font-size: 13px; padding: 6px 0;">Ration Card:</td>
                  <td style="color: #1a1a2e; font-weight: bold;">${rationCardNumber}</td>
                </tr>
                <tr>
                  <td style="color: #888; font-size: 13px; padding: 6px 0;">Members:</td>
                  <td style="color: #1a1a2e; font-weight: bold;">${members.join(", ")}</td>
                </tr>
                <tr>
                  <td style="color: #888; font-size: 13px; padding: 6px 0;">Verification:</td>
                  <td style="color: #1a1a2e; font-weight: bold; text-transform: capitalize;">${verificationType === "otp" ? "Aadhaar OTP" : "Face Recognition"}</td>
                </tr>
                <tr>
                  <td style="color: #888; font-size: 13px; padding: 6px 0;">Status:</td>
                  <td style="color: #f59e0b; font-weight: bold;">Pending Verification</td>
                </tr>
              </table>
            </div>

            <p style="color: #555; font-size: 14px;">
              Your token is now under review by the ration authority. You will be notified once it is verified.
              Visit your nearest ration shop with this token number after verification.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #aaa; font-size: 12px; text-align: center;">
              Karnataka State Government — E-Ration Administration<br/>
              This is an automated message. Please do not reply.
            </p>
          </div>
        </div>
      `,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info({ previewUrl }, "Token confirmation email preview");
    }
    logger.info({ to: toEmail, tokenNumber }, "Token confirmation email sent");
    return { success: true };
  } catch (err) {
    logger.error({ err }, "Failed to send token confirmation email");
    return { success: false };
  }
}
