import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, tokensTable, usersTable } from "@workspace/db";
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

  const [token] = await db
    .insert(tokensTable)
    .values({
      tokenNumber,
      rationCardNumber: parsed.data.rationCardNumber,
      holderName: parsed.data.selectedMembers[0] || "Unknown",
      selectedMembers: parsed.data.selectedMembers,
      verificationType: parsed.data.verificationType,
      status: "pending",
      userId,
    })
    .returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
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
    id: token.id,
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

  const tokens = await db
    .select()
    .from(tokensTable)
    .where(eq(tokensTable.userId, userId))
    .orderBy(desc(tokensTable.createdAt));

  res.json(
    tokens.map((t) => ({
      id: t.id,
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

  let query = db
    .select({
      id: tokensTable.id,
      tokenNumber: tokensTable.tokenNumber,
      rationCardNumber: tokensTable.rationCardNumber,
      holderName: tokensTable.holderName,
      selectedMembers: tokensTable.selectedMembers,
      verificationType: tokensTable.verificationType,
      status: tokensTable.status,
      createdAt: tokensTable.createdAt,
      updatedAt: tokensTable.updatedAt,
      userId: tokensTable.userId,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(tokensTable)
    .innerJoin(usersTable, eq(tokensTable.userId, usersTable.id))
    .orderBy(desc(tokensTable.createdAt))
    .$dynamic();

  if (params.success && params.data.status) {
    query = query.where(eq(tokensTable.status, params.data.status as any));
  }

  const tokens = await query;

  res.json(
    tokens.map((t) => ({
      id: t.id,
      tokenNumber: t.tokenNumber,
      rationCardNumber: t.rationCardNumber,
      holderName: t.holderName,
      userName: t.userName,
      userEmail: t.userEmail,
      selectedMembers: t.selectedMembers,
      verificationType: t.verificationType,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt?.toISOString(),
    })),
  );
});

router.post("/admin/tokens/:tokenId/verify", async (req, res): Promise<void> => {
  const role = (req.session as any)?.role;
  if (role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }

  const raw = Array.isArray(req.params.tokenId) ? req.params.tokenId[0] : req.params.tokenId;
  const tokenId = parseInt(raw, 10);

  const [token] = await db
    .update(tokensTable)
    .set({ status: "verified", updatedAt: new Date() })
    .where(eq(tokensTable.id, tokenId))
    .returning();

  if (!token) {
    res.status(404).json({ message: "Token not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, token.userId));

  res.json({
    id: token.id,
    tokenNumber: token.tokenNumber,
    rationCardNumber: token.rationCardNumber,
    holderName: token.holderName,
    userName: user?.name || "",
    userEmail: user?.email || "",
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

  const raw = Array.isArray(req.params.tokenId) ? req.params.tokenId[0] : req.params.tokenId;
  const tokenId = parseInt(raw, 10);

  const [token] = await db
    .update(tokensTable)
    .set({ status: "approved", updatedAt: new Date() })
    .where(eq(tokensTable.id, tokenId))
    .returning();

  if (!token) {
    res.status(404).json({ message: "Token not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, token.userId));

  res.json({
    id: token.id,
    tokenNumber: token.tokenNumber,
    rationCardNumber: token.rationCardNumber,
    holderName: token.holderName,
    userName: user?.name || "",
    userEmail: user?.email || "",
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

  const raw = Array.isArray(req.params.tokenId) ? req.params.tokenId[0] : req.params.tokenId;
  const tokenId = parseInt(raw, 10);

  const [token] = await db
    .update(tokensTable)
    .set({ status: "distributed", updatedAt: new Date() })
    .where(eq(tokensTable.id, tokenId))
    .returning();

  if (!token) {
    res.status(404).json({ message: "Token not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, token.userId));

  res.json({
    id: token.id,
    tokenNumber: token.tokenNumber,
    rationCardNumber: token.rationCardNumber,
    holderName: token.holderName,
    userName: user?.name || "",
    userEmail: user?.email || "",
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

  const allTokens = await db.select().from(tokensTable);

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
