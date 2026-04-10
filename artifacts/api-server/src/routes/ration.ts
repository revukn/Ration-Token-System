import { Router, type IRouter } from "express";
import { VerifyRationCardBody, SendOtpBody, VerifyOtpBody, VerifyFaceBody } from "@workspace/api-zod";

const router: IRouter = Router();

const SAMPLE_RATION_CARDS: Record<string, any> = {
  "KA-BNG-2024-001": {
    rationCardNumber: "KA-BNG-2024-001",
    holderName: "Rajesh Kumar",
    cardType: "BPL",
    familyMembers: [
      { id: 1, name: "Rajesh Kumar", aadhaarLast4: "4523", age: 45, relation: "Self" },
      { id: 2, name: "Sunita Kumar", aadhaarLast4: "7891", age: 40, relation: "Wife" },
      { id: 3, name: "Amit Kumar", aadhaarLast4: "3456", age: 18, relation: "Son" },
      { id: 4, name: "Priya Kumar", aadhaarLast4: "6789", age: 15, relation: "Daughter" },
    ],
  },
  "KA-BNG-2024-002": {
    rationCardNumber: "KA-BNG-2024-002",
    holderName: "Lakshmi Devi",
    cardType: "AAY",
    familyMembers: [
      { id: 5, name: "Lakshmi Devi", aadhaarLast4: "1234", age: 55, relation: "Self" },
      { id: 6, name: "Venkatesh", aadhaarLast4: "5678", age: 58, relation: "Husband" },
      { id: 7, name: "Suresh", aadhaarLast4: "9012", age: 28, relation: "Son" },
    ],
  },
  "KA-MYS-2024-003": {
    rationCardNumber: "KA-MYS-2024-003",
    holderName: "Manjunath Gowda",
    cardType: "PHH",
    familyMembers: [
      { id: 8, name: "Manjunath Gowda", aadhaarLast4: "2345", age: 35, relation: "Self" },
      { id: 9, name: "Kavitha Gowda", aadhaarLast4: "6780", age: 32, relation: "Wife" },
      { id: 10, name: "Deepa Gowda", aadhaarLast4: "1122", age: 8, relation: "Daughter" },
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
    res.status(404).json({ message: "Ration card not found. Try: KA-BNG-2024-001, KA-BNG-2024-002, or KA-MYS-2024-003" });
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
