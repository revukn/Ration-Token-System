import { Router, type IRouter } from "express";
import { VerifyRationCardBody, SendOtpBody, VerifyOtpBody, VerifyFaceBody } from "@workspace/api-zod";

const router: IRouter = Router();

const SAMPLE_RATION_CARDS: Record<string, any> = {
  "KA-BNG-2024-001": {
    rationCardNumber: "KA-BNG-2024-001",
    holderName: "Revanna",
    cardType: "BPL",
    familyMembers: [
      { id: 1, name: "Revanna", aadhaarLast4: "4523", age: 48, relation: "Self" },
      { id: 2, name: "Jayanthi Revanna", aadhaarLast4: "7891", age: 43, relation: "Wife" },
      { id: 3, name: "Suresh Revanna", aadhaarLast4: "3456", age: 22, relation: "Son" },
      { id: 4, name: "Geetha Revanna", aadhaarLast4: "6789", age: 18, relation: "Daughter" },
    ],
  },
  "KA-BNG-2024-002": {
    rationCardNumber: "KA-BNG-2024-002",
    holderName: "Jayanth",
    cardType: "AAY",
    familyMembers: [
      { id: 5, name: "Jayanth", aadhaarLast4: "1234", age: 40, relation: "Self" },
      { id: 6, name: "Savitha Jayanth", aadhaarLast4: "5678", age: 37, relation: "Wife" },
      { id: 7, name: "Rahul Jayanth", aadhaarLast4: "9012", age: 15, relation: "Son" },
      { id: 8, name: "Divya Jayanth", aadhaarLast4: "3344", age: 12, relation: "Daughter" },
    ],
  },
  "KA-MYS-2024-003": {
    rationCardNumber: "KA-MYS-2024-003",
    holderName: "Basapa",
    cardType: "PHH",
    familyMembers: [
      { id: 9, name: "Basapa", aadhaarLast4: "2345", age: 55, relation: "Self" },
      { id: 10, name: "Kamala Basapa", aadhaarLast4: "6780", age: 50, relation: "Wife" },
      { id: 11, name: "Ravi Basapa", aadhaarLast4: "1122", age: 28, relation: "Son" },
      { id: 12, name: "Shanthi Basapa", aadhaarLast4: "4455", age: 24, relation: "Daughter" },
    ],
  },
};

const otpStore: Record<string, string> = {};

router.post("/ration-cards/verify", async (req, res): Promise<void> => {
  const parsed = VerifyRationCardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const card = SAMPLE_RATION_CARDS[parsed.data.rationCardNumber];
  if (!card) {
    res.status(404).json({ message: "Ration card not found. Try: KA-BNG-2024-001 (Revanna), KA-BNG-2024-002 (Jayanth), or KA-MYS-2024-003 (Basapa)" });
    return;
  }

  res.json(card);
});

router.post("/verification/send-otp", async (req, res): Promise<void> => {
  const parsed = SendOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[parsed.data.aadhaarNumber] = otp;

  req.log.info({ aadhaar: parsed.data.aadhaarNumber, otp }, "OTP generated (demo mode)");

  res.json({ message: `OTP sent successfully. For demo, use: ${otp}` });
});

router.post("/verification/verify-otp", async (req, res): Promise<void> => {
  const parsed = VerifyOtpBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const storedOtp = otpStore[parsed.data.aadhaarNumber];
  if (!storedOtp || storedOtp !== parsed.data.otp) {
    res.status(400).json({ message: "Invalid OTP" });
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

  res.json({ verified: true, message: "Face verification successful" });
});

export default router;
