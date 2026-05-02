import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { User, RationCard } from "@workspace/db";
import { RegisterUserBody, LoginUserBody, AdminLoginBody } from "@workspace/api-zod";
import { sendPasswordResetOtpEmail } from "../lib/mailer";

const router: IRouter = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { name, email, password, rationCardNumber } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400).json({ message: "Email already registered" });
    return;
  }

  const existingRationCard = await User.findOne({ rationCardNumber });
  if (existingRationCard) {
    res.status(400).json({ message: "Ration card already registered" });
    return;
  }

  const rationCard = await RationCard.findOne({ 
    rationCardNumber, 
    isActive: true 
  });

  if (!rationCard) {
    res.status(400).json({ message: "Invalid ration card number" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || "";

  const user = await User.create({
    firstName,
    lastName,
    email,
    password: hashedPassword,
    rationCardNumber,
    role: "user"
  });

  (req.session as any).userId = user._id.toString();
  (req.session as any).role = user.role;

  res.status(201).json({
    user: {
      id: user._id.toString(),
      name: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      rationCardNumber: user.rationCardNumber,
      role: user.role,
    },
    message: "Registration successful",
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { rationCardNumber, password } = parsed.data;

  const user = await User.findOne({ rationCardNumber });

  if (!user) {
    res.status(401).json({ message: "Invalid ration card number or password" });
    return;
  }

  if (user.role !== "user") {
    res.status(401).json({ message: "Invalid ration card number or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ message: "Invalid ration card number or password" });
    return;
  }

  (req.session as any).userId = user._id.toString();
  (req.session as any).role = user.role;

  res.json({
    user: {
      id: user._id.toString(),
      name: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      rationCardNumber: user.rationCardNumber,
      role: user.role,
    },
    message: "Login successful",
  });
});

router.post("/auth/admin/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;

  const user = await User.findOne({ email });

  if (!user || user.role !== "admin") {
    res.status(401).json({ message: "Invalid admin credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    res.status(401).json({ message: "Invalid admin credentials" });
    return;
  }

  (req.session as any).userId = user._id.toString();
  (req.session as any).role = user.role;

  res.json({
    user: {
      id: user._id.toString(),
      name: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      rationCardNumber: user.rationCardNumber,
      role: user.role,
    },
    message: "Admin login successful",
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const user = await User.findById(userId);

  if (!user) {
    res.status(401).json({ message: "User not found" });
    return;
  }

  res.json({
    id: user._id.toString(),
    name: `${user.firstName}${user.lastName ? " " + user.lastName : ""}`,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    rationCardNumber: user.rationCardNumber,
    role: user.role,
  });
});

router.post("/auth/forgot-password", async (req, res): Promise<void> => {
  const { rationCardNumber } = req.body;

  if (!rationCardNumber) {
    res.status(400).json({ message: "Ration card number is required" });
    return;
  }

  try {
    const user = await User.findOne({ rationCardNumber });
    if (!user) {
      res.status(404).json({ message: "No account found with this ration card number" });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetOtp = otp;
    user.resetOtpExpiry = otpExpiry;
    await user.save();

    const userName = `${user.firstName}${user.lastName ? " " + user.lastName : ""}`;
    const emailResult = await sendPasswordResetOtpEmail(user.email, otp, userName);

    const maskedEmail = user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3");

    res.json({
      message: `OTP sent to ${maskedEmail}`,
      email: maskedEmail,
      ...(emailResult.previewUrl ? { previewUrl: emailResult.previewUrl } : {}),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
});

router.post("/auth/verify-reset-otp", async (req, res): Promise<void> => {
  const { rationCardNumber, otp } = req.body;

  if (!rationCardNumber || !otp) {
    res.status(400).json({ message: "Ration card number and OTP are required" });
    return;
  }

  try {
    const user = await User.findOne({ rationCardNumber });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!user.resetOtp || !user.resetOtpExpiry) {
      res.status(400).json({ message: "No OTP request found. Please request a new OTP." });
      return;
    }

    if (new Date() > user.resetOtpExpiry) {
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      await user.save();
      res.status(400).json({ message: "OTP has expired. Please request a new one." });
      return;
    }

    if (user.resetOtp !== otp) {
      res.status(400).json({ message: "Invalid OTP. Please try again." });
      return;
    }

    res.json({ message: "OTP verified successfully", verified: true });
  } catch (error) {
    res.status(500).json({ message: "Verification failed. Please try again." });
  }
});

router.post("/auth/reset-password", async (req, res): Promise<void> => {
  const { rationCardNumber, otp, newPassword } = req.body;

  if (!rationCardNumber || !otp || !newPassword) {
    res.status(400).json({ message: "All fields are required" });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ message: "Password must be at least 6 characters" });
    return;
  }

  try {
    const user = await User.findOne({ rationCardNumber });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (!user.resetOtp || !user.resetOtpExpiry) {
      res.status(400).json({ message: "No OTP request found. Please start over." });
      return;
    }

    if (new Date() > user.resetOtpExpiry) {
      user.resetOtp = null;
      user.resetOtpExpiry = null;
      await user.save();
      res.status(400).json({ message: "OTP has expired. Please request a new one." });
      return;
    }

    if (user.resetOtp !== otp) {
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();

    res.json({ message: "Password reset successful. Please login with your new password." });
  } catch (error) {
    res.status(500).json({ message: "Password reset failed. Please try again." });
  }
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {});
  res.json({ message: "Logged out successfully" });
});

export default router;
