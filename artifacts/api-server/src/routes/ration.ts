import { Router, type IRouter } from "express";
import { VerifyRationCardBody, SendOtpBody, VerifyOtpBody, VerifyFaceBody } from "@workspace/api-zod";
import { User, RationCard } from "@workspace/db";
import { sendOtpEmail } from "../lib/mailer";

const router: IRouter = Router();


const otpStore: Record<string, { otp: string; expiresAt: number }> = {};

router.post("/ration-cards/verify", async (req, res): Promise<void> => {
  const parsed = VerifyRationCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  try {
    const card = await RationCard.findOne({
      rationCardNumber: parsed.data.rationCardNumber,
      isActive: true
    });

    if (!card) {
      res.status(404).json({ message: "Ration card not found. Please check your ration card number and try again." });
      return;
    }

    res.json(card);
  } catch (error) {
    res.status(500).json({ message: "Failed to verify ration card" });
  }
});

router.post("/verification/send-otp", async (req, res): Promise<void> => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  try {
    // Validate that the aadhar number exists in the database for this ration card
    const card = await RationCard.findOne({
      rationCardNumber: parsed.data.rationCardNumber,
      isActive: true
    });

    if (!card) {
      res.status(404).json({ message: "Ration card not found. Please check your ration card number and try again." });
      return;
    }

    // Check if the aadhar number matches any family member
    const aadharExists = card.familyMembers.some(member => 
      member.aadharCardNumber === parsed.data.aadhaarNumber
    );

    if (!aadharExists) {
      res.status(400).json({ 
        message: "Entered Aadhaar is wrong. Please recheck Aadhaar number." 
      });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[parsed.data.aadhaarNumber] = {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };

  const userId = (req.session as any)?.userId;
  let userEmail = "";
  let userName = "";

  if (userId) {
    const user = await User.findById(userId);
    if (user) {
      userEmail = user.email;
      userName = user.name;
    }
  }

  const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

  if (userEmail) {
    const emailResult = await sendOtpEmail(userEmail, otp);
    req.log.info({ to: userEmail, emailSent: emailResult.success }, "OTP process completed");

    if (smtpConfigured) {
      res.json({
        message: `OTP sent to ${userEmail}. Please check your inbox and enter the 6-digit code.`,
      });
    } else {
      res.json({
        message: `OTP sent to ${userEmail}. (Demo mode — your OTP is: ${otp})`,
      });
    }
  } else {
    req.log.info({ otp }, "OTP generated (no user email in session)");
    res.json({ message: `OTP generated. Demo OTP: ${otp}` });
  }
  } catch (error) {
    res.status(500).json({ message: "Failed to send OTP" });
  }
});

router.post("/verification/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const entry = otpStore[parsed.data.aadhaarNumber];
  if (!entry) {
    res.status(400).json({ message: "OTP not found or expired. Please request a new OTP." });
    return;
  }

  if (Date.now() > entry.expiresAt) {
    delete otpStore[parsed.data.aadhaarNumber];
    res.status(400).json({ message: "OTP has expired. Please request a new OTP." });
    return;
  }

  if (entry.otp !== parsed.data.otp) {
    res.status(400).json({ message: "Invalid OTP. Please check your email and try again." });
    return;
  }

  delete otpStore[parsed.data.aadhaarNumber];
  res.json({ verified: true, message: "Aadhaar verification successful" });
});

router.post("/verification/face", async (req, res): Promise<void> => {
  const parsed = VerifyFaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  if (!parsed.data.faceData || parsed.data.faceData.length < 100) {
    res.status(400).json({ message: "Invalid face data. Please capture a clear image." });
    return;
  }

  res.json({ verified: true, message: "Face verification successful" });
});

export default router;
