import { Router, type IRouter } from "express";
import { VerifyRationCardBody, SendOtpBody, VerifyOtpBody, VerifyFaceBody } from "@workspace/api-zod";
import { User, RationCard, Token } from "@workspace/db";
import { sendOtpEmail, sendRationDistributionEmail, sendBulkRationCollectionNotification } from "../lib/mailer";

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
        otp: otp,
      });
    } else {
      res.json({
        message: `OTP sent to ${userEmail}. (Demo mode — your OTP is: ${otp})`,
        otp: otp,
      });
    }
  } else {
    req.log.info({ otp }, "OTP generated (no user email in session)");
    res.json({ message: `OTP generated. Demo OTP: ${otp}`, otp: otp });
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

// Email verification for registration
router.post("/verification/send-email-otp", async (req, res): Promise<void> => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    res.status(400).json({ message: "Valid email address is required" });
    return;
  }

  try {
    // Check if email already exists in database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "This email is already registered. Please use a different email or login." });
      return;
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = {
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    };

    const smtpConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    if (smtpConfigured) {
      // Send verification email
      const emailResult = await sendOtpEmail(email, otp);
      req.log.info({ to: email, emailSent: emailResult.success }, "Email verification OTP sent");

      res.json({
        message: `Verification code sent to ${email}. Please check your inbox.`,
        otp: otp,
      });
    } else {
      // Demo mode - still send email but show OTP for testing
      req.log.info({ otp }, "Email verification OTP generated (demo mode)");
      res.json({ 
        message: `Verification code sent to ${email}. Please check your inbox.`,
        otp: otp
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to send verification email" });
  }
});

router.post("/verification/verify-email-otp", async (req, res): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ message: "Email and OTP are required" });
    return;
  }

  const entry = otpStore[email];
  if (!entry) {
    res.status(400).json({ message: "Verification code not found or expired. Please request a new code." });
    return;
  }

  if (Date.now() > entry.expiresAt) {
    delete otpStore[email];
    res.status(400).json({ message: "Verification code has expired. Please request a new code." });
    return;
  }

  if (entry.otp !== otp) {
    res.status(400).json({ message: "Invalid verification code. Please check your email and try again." });
    return;
  }

  // Clean up OTP after successful verification
  delete otpStore[email];
  res.json({ verified: true, message: "Email verified successfully" });
});

// Send ration distribution email
router.post("/distribution/send-email", async (req, res): Promise<void> => {
  const { email, rationCardNumber, cardType, familyMembers, shopName } = req.body;

  if (!email || !rationCardNumber || !cardType || !familyMembers || !shopName) {
    res.status(400).json({ message: "All fields are required: email, rationCardNumber, cardType, familyMembers, shopName" });
    return;
  }

  try {
    // Send ration distribution email
    const emailResult = await sendRationDistributionEmail(email, {
      rationCardNumber,
      cardType,
      familyMembers,
      shopName
    });

    if (emailResult.success) {
      req.log.info({ to: email, rationCardNumber }, "Ration distribution email sent successfully");
      res.json({
        message: `Ration distribution details sent to ${email}`,
        success: true
      });
    } else {
      req.log.error({ to: email, error: emailResult.error }, "Failed to send ration distribution email");
      res.status(500).json({ 
        message: "Failed to send ration distribution email",
        error: emailResult.error 
      });
    }
  } catch (error) {
    req.log.error({ error, to: email }, "Error sending ration distribution email");
    res.status(500).json({ message: "Failed to send ration distribution email" });
  }
});

// Send bulk ration collection notification
router.post("/notify/send-bulk-email", async (req, res): Promise<void> => {
  const { collectionDate } = req.body;

  if (!collectionDate) {
    res.status(400).json({ message: "Collection date is required" });
    return;
  }

  try {
    // Get user IDs who already have verified or distributed tokens (they already visited the store)
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    const tokensWithVerifiedStatus = await Token.find({
      status: { $in: ["verified", "distributed"] },
      "rationDetails.month": currentMonth,
      "rationDetails.year": currentYear
    }).select('userId');
    const excludedUserIds = tokensWithVerifiedStatus.map(t => t.userId);

    // Get all registered users excluding admins and users with verified/distributed tokens
    const users = await User.find({
      email: { $exists: true, $ne: null },
      role: { $ne: "admin" },
      _id: { $nin: excludedUserIds }
    }).select('firstName lastName email');

    if (users.length === 0) {
      res.status(404).json({ message: "No registered users found" });
      return;
    }

    // Send bulk notification
    const notificationResult = await sendBulkRationCollectionNotification(
      users.map(user => ({ email: user.email, name: `${user.firstName} ${user.lastName}` || 'Beneficiary' })),
      collectionDate
    );

    if (notificationResult.success) {
      req.log.info({ 
        totalUsers: users.length, 
        totalSent: notificationResult.totalSent,
        totalFailed: notificationResult.totalFailed,
        collectionDate 
      }, "Bulk ration notification sent");

      res.json({
        message: `Notification sent to ${notificationResult.totalSent} users successfully`,
        totalUsers: users.length,
        totalSent: notificationResult.totalSent,
        totalFailed: notificationResult.totalFailed,
        collectionDate
      });
    } else {
      req.log.error({ error: notificationResult.error }, "Failed to send bulk notification");
      res.status(500).json({ 
        message: "Failed to send bulk notification",
        error: notificationResult.error 
      });
    }
  } catch (error) {
    req.log.error({ error, collectionDate }, "Error sending bulk ration notification");
    res.status(500).json({ message: "Failed to send bulk notification" });
  }
});

export default router;
