import { Router, type IRouter } from "express";
import { Token, User } from "@workspace/db";
import { GenerateTokenBody, GetAllTokensQueryParams } from "@workspace/api-zod";
import { sendTokenConfirmationEmail } from "../lib/mailer";

const router: IRouter = Router();

function generateTokenNumber(): string {
  const prefix = "TKN";
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${dateStr}-${random}`;
}

router.post("/tokens/generate", async (req, res): Promise<void> => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const parsed = GenerateTokenBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message });
    return;
  }

  const tokenNumber = generateTokenNumber();

  const token = await Token.create({
    tokenNumber,
    rationCardNumber: parsed.data.rationCardNumber,
    holderName: parsed.data.selectedMembers[0] || "Unknown",
    selectedMembers: parsed.data.selectedMembers,
    verificationType: parsed.data.verificationType,
    status: "pending",
    userId,
  });

  const user = await User.findById(userId);
  if (user) {
    sendTokenConfirmationEmail(
      user.email,
      user.name,
      token.tokenNumber,
      token.rationCardNumber,
      token.selectedMembers as string[],
      token.verificationType,
    ).catch(() => {});
  }

  res.status(201).json({
    id: token._id.toString(),
    tokenNumber: token.tokenNumber,
    rationCardNumber: token.rationCardNumber,
    holderName: token.holderName,
    selectedMembers: token.selectedMembers,
    verificationType: token.verificationType,
    status: token.status,
    createdAt: token.createdAt.toISOString(),
    updatedAt: token.updatedAt.toISOString(),
  });
});

router.get("/tokens/my-tokens", async (req, res): Promise<void> => {
  const userId = (req.session as any)?.userId;
  if (!userId) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  const tokens = await Token.find({ userId }).sort({ createdAt: -1 });

  res.json(
    tokens.map((t) => ({
      id: t._id.toString(),
      tokenNumber: t.tokenNumber,
      rationCardNumber: t.rationCardNumber,
      holderName: t.holderName,
      selectedMembers: t.selectedMembers,
      verificationType: t.verificationType,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  );
});

router.get("/admin/tokens", async (req, res): Promise<void> => {
  const role = (req.session as any)?.role;
  if (role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  const params = GetAllTokensQueryParams.safeParse(req.query);

  let query: any = { status: params.success && params.data.status ? params.data.status : { $exists: true } };

  const tokens = await Token.find(query)
    .populate('userId', 'name email')
    .sort({ createdAt: -1 });

  res.json(
    tokens.map((t) => ({
      id: t._id.toString(),
      tokenNumber: t.tokenNumber,
      rationCardNumber: t.rationCardNumber,
      holderName: t.holderName,
      userName: (t.userId as any)?.name || 'Unknown',
      userEmail: (t.userId as any)?.email || 'Unknown',
      selectedMembers: t.selectedMembers,
      verificationType: t.verificationType,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
  );
});

router.post("/admin/tokens/:tokenId/verify", async (req, res): Promise<void> => {
  const role = (req.session as any)?.role;
  if (role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  const tokenId = req.params.tokenId;

  const token = await Token.findByIdAndUpdate(
    tokenId,
    { status: "verified", updatedAt: new Date() },
    { new: true }
  ).populate('userId', 'name email');

  if (!token) {
    res.status(404).json({ message: "Token not found" });
    return;
  }

  res.json({
    id: token._id.toString(),
    tokenNumber: token.tokenNumber,
    rationCardNumber: token.rationCardNumber,
    holderName: token.holderName,
    userName: (token.userId as any)?.name || "",
    userEmail: (token.userId as any)?.email || "",
    selectedMembers: token.selectedMembers,
    verificationType: token.verificationType,
    status: token.status,
    createdAt: token.createdAt.toISOString(),
    updatedAt: token.updatedAt.toISOString(),
  });
});

router.post("/admin/tokens/:tokenId/approve", async (req, res): Promise<void> => {
  const role = (req.session as any)?.role;
  if (role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  const tokenId = req.params.tokenId;

  const token = await Token.findByIdAndUpdate(
    tokenId,
    { status: "approved", updatedAt: new Date() },
    { new: true }
  ).populate('userId', 'name email');

  if (!token) {
    res.status(404).json({ message: "Token not found" });
    return;
  }

  res.json({
    id: token._id.toString(),
    tokenNumber: token.tokenNumber,
    rationCardNumber: token.rationCardNumber,
    holderName: token.holderName,
    userName: (token.userId as any)?.name || "",
    userEmail: (token.userId as any)?.email || "",
    selectedMembers: token.selectedMembers,
    verificationType: token.verificationType,
    status: token.status,
    createdAt: token.createdAt.toISOString(),
    updatedAt: token.updatedAt.toISOString(),
  });
});

router.post("/admin/tokens/:tokenId/distribute", async (req, res): Promise<void> => {
  const role = (req.session as any)?.role;
  if (role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  const tokenId = req.params.tokenId;

  const token = await Token.findByIdAndUpdate(
    tokenId,
    { status: "distributed", updatedAt: new Date() },
    { new: true }
  ).populate('userId', 'name email');

  if (!token) {
    res.status(404).json({ message: "Token not found" });
    return;
  }

  res.json({
    id: token._id.toString(),
    tokenNumber: token.tokenNumber,
    rationCardNumber: token.rationCardNumber,
    holderName: token.holderName,
    userName: (token.userId as any)?.name || "",
    userEmail: (token.userId as any)?.email || "",
    selectedMembers: token.selectedMembers,
    verificationType: token.verificationType,
    status: token.status,
    createdAt: token.createdAt.toISOString(),
    updatedAt: token.updatedAt.toISOString(),
  });
});

router.get("/admin/dashboard-stats", async (req, res): Promise<void> => {
  const role = (req.session as any)?.role;
  if (role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  const allTokens = await Token.find({});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    totalTokens: allTokens.length,
    pendingTokens: allTokens.filter((t) => t.status === "pending").length,
    verifiedTokens: allTokens.filter((t) => t.status === "verified").length,
    approvedTokens: allTokens.filter((t) => t.status === "approved").length,
    distributedTokens: allTokens.filter((t) => t.status === "distributed").length,
    todayTokens: allTokens.filter((t) => t.createdAt >= today).length,
  };

  res.json(stats);
});

router.get("/admin/recent-activity", async (req, res): Promise<void> => {
  const role = (req.session as any)?.role;
  if (role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  const tokens = await db
    .select({
      id: tokensTable.id,
      tokenNumber: tokensTable.tokenNumber,
      status: tokensTable.status,
      updatedAt: tokensTable.updatedAt,
      userName: usersTable.name,
    })
    .from(tokensTable)
    .innerJoin(usersTable, eq(tokensTable.userId, usersTable.id))
    .orderBy(desc(tokensTable.updatedAt))
    .limit(20);

  const activityMap: Record<string, string> = {
    pending: "Token Generated",
    verified: "Token Verified",
    approved: "Distribution Approved",
    distributed: "Ration Distributed",
  };

  res.json(
    tokens.map((t) => ({
      id: t.id,
      tokenNumber: t.tokenNumber,
      action: activityMap[t.status] || t.status,
      userName: t.userName,
      timestamp: t.updatedAt.toISOString(),
    })),
  );
});

export default router;
