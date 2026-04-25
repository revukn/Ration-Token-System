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

export async function sendRationDistributionEmail(
  toEmail: string,
  rationDetails: {
    rationCardNumber: string;
    cardType: string;
    familyMembers: number;
    shopName: string;
  }
) {
  try {
    const transport = await getTransporter();
    
    // Generate the ration message using the existing function
    const { generateRationMessage } = await import('../services/rationService');
    const messageBody = generateRationMessage(
      rationDetails.rationCardNumber,
      rationDetails.cardType,
      rationDetails.familyMembers,
      rationDetails.shopName
    );

    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const info = await transport.sendMail({
      from: `"E-Ration Token System" <noreply@eration.karnataka.gov.in>`,
      to: toEmail,
      subject: `Your Ration for ${currentMonth} is Distributed Successfully`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border: 1px solid #dee2e6;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2c3e50; margin: 0;">🏛️ Food & Civil Supplies Karnataka</h1>
            <h2 style="color: #27ae60; margin: 10px 0;">Ration Distribution Confirmation</h2>
          </div>
          
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center; border: 2px solid #27ae60;">
            <h2 style="color: #155724; margin: 0 0 5px 0;">✅ Distribution Successful!</h2>
            <p style="color: #155724; margin: 0; font-size: 16px;">Your ration for <strong>${currentMonth}</strong> has been distributed successfully.</p>
            <p style="color: #155724; margin: 5px 0 0 0; font-size: 14px;">ನಿಮ್ಮ <strong>${currentMonth}</strong> ತಿಂಗಳ ಪಡಿತರವನ್ನು ಯಶಸ್ವಿಯಾಗಿ ವಿತರಿಸಲಾಗಿದೆ.</p>
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin-top: 0;">Dear Beneficiary,</h3>
            <p style="color: #555; line-height: 1.6;">Your ration for this month has been successfully distributed. Below are the details of the items distributed to you:</p>
          </div>
          
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #27ae60;">
            <pre style="white-space: pre-wrap; font-family: monospace; margin: 0; color: #2c3e50;">${messageBody}</pre>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
            <h4 style="color: #856404; margin-top: 0;">Important Information:</h4>
            <ul style="color: #856404; margin: 10px 0; padding-left: 20px;">
              <li>Please collect your ration within the specified time</li>
              <li>Bring your ration card and original ID proof</li>
              <li>Report any issues immediately to the helpline</li>
            </ul>
          </div>
          
          <div style="text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px;">
            <p>This is an automated message from the Public Distribution System.</p>
            <p>For complaints: 1967, 1800-425-6900 | 🏪 FCSKAR</p>
          </div>
        </div>
      `,
    });
    
    logger.info({ to: toEmail, messageId: info.messageId }, "Ration distribution email sent");
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    logger.error({ err, to: toEmail }, "Failed to send ration distribution email");
    return { success: false, error: err?.message || String(err) };
  }
}

export async function sendBulkRationCollectionNotification(
  users: Array<{ email: string; name: string }>,
  collectionDate: string
) {
  try {
    const transport = await getTransporter();
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    const formattedDate = new Date(collectionDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa; border: 1px solid #dee2e6;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #2c3e50; margin: 0;">🏛️ Food & Civil Supplies Karnataka</h1>
          <h2 style="color: #e74c3c; margin: 10px 0;">Ration Collection Reminder</h2>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #2c3e50; margin-top: 0;">Dear Beneficiaries,</h3>
          <p style="color: #555; line-height: 1.6;">Please generate token if not done already. If you already have generated token, come to your nearby ration center and collect ration on this date (${formattedDate}).</p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
          <h4 style="color: #856404; margin-top: 0;">📅 Collection Details:</h4>
          <ul style="color: #856404; margin: 10px 0; padding-left: 20px;">
            <li><strong>Date:</strong> ${formattedDate}</li>
            <li><strong>Action Required:</strong> Generate token (if not done)</li>
            <li><strong>Location:</strong> Your nearby ration center</li>
            <li><strong>Documents:</strong> Bring ration card and ID proof</li>
          </ul>
        </div>

        <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #27ae60;">
          <h4 style="color: #27ae60; margin-top: 0;">ಕನ್ನಡದಲ್ಲಿ / In Kannada:</h4>
          <p style="color: #2c3e50; line-height: 1.6;">ಪ್ರಿಯ ಫಲಾನುಭವಿಗಳೇ, ದಯವಿಟ್ಟು ಟೋಕನ್ ಅನ್ನು ಜನರೇಟ್ ಮಾಡಿ ಇಲ್ಲದಿದ್ದರೆ, ನೀವು ಈಗಾಗಲೇ ಟೋಕನ್ ಅನ್ನು ಜನರೇಟ್ ಮಾಡಿದ್ದರೆ, ಈ ದಿನಾಂಕದಂದು (${formattedDate}) ನಿಮ್ಮ ಹತ್ತಿರದ ಪಡಿತರ ಕೇಂದ್ರಕ್ಕೆ ಬಂದು ಪಡಿತರವನ್ನು ಸಂಗ್ರಹಿಸಿ.</p>
        </div>
        
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #dc3545;">
          <h4 style="color: #721c24; margin-top: 0;">Important Instructions:</h4>
          <ul style="color: #721c24; margin: 10px 0; padding-left: 20px;">
            <li>Generate your token before visiting the center</li>
            <li>Bring original ration card and ID proof</li>
            <li>Report any issues to: 1967, 1800-425-6900</li>
          </ul>
        </div>
        
        <div style="text-align: center; color: #6c757d; font-size: 12px; margin-top: 20px;">
          <p>This is an automated reminder from the Public Distribution System.</p>
          <p>For complaints: 1967, 1800-425-6900 | 🏪 FCSKAR</p>
        </div>
      </div>
    `;

    const results = [];
    
    for (const user of users) {
      try {
        const info = await transport.sendMail({
          from: `"E-Ration Token System" <noreply@eration.karnataka.gov.in>`,
          to: user.email,
          subject: `Remember to Generate token and collect Ration for this month ${currentMonth}`,
          html: emailTemplate.replace('Dear Beneficiaries,', `Dear ${user.name},`)
        });
        
        results.push({ email: user.email, success: true, messageId: info.messageId });
        logger.info({ to: user.email, messageId: info.messageId }, "Bulk ration reminder email sent");
      } catch (error: any) {
        results.push({ email: user.email, success: false, error: error?.message || String(error) });
        logger.error({ error, to: user.email }, "Failed to send bulk ration reminder email");
      }
    }
    
    return { 
      success: true, 
      totalSent: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
      results 
    };
  } catch (err) {
    logger.error({ err }, "Failed to send bulk ration collection notification");
    return { success: false, error: err.message };
  }
}
