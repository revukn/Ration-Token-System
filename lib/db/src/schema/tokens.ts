import mongoose from "mongoose";
import { z } from "zod/v4";

export const tokenStatusEnum = ["pending", "verified", "distributed"] as const;
export const verificationTypeEnum = ["face", "otp"] as const;

const tokenSchema = new mongoose.Schema({
  tokenNumber: { type: String, required: true, unique: true },
  rationCardNumber: { type: String, required: true },
  holderName: { type: String, required: true },
  selectedMembers: { type: [String], required: true },
  verificationType: { type: String, enum: verificationTypeEnum, required: true },
  status: { type: String, enum: tokenStatusEnum, default: "pending" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const Token = mongoose.model("Token", tokenSchema);

export const insertTokenSchema = z.object({
  tokenNumber: z.string(),
  rationCardNumber: z.string(),
  holderName: z.string(),
  selectedMembers: z.array(z.string()),
  verificationType: z.enum(verificationTypeEnum),
  status: z.enum(tokenStatusEnum).optional(),
  userId: z.string()
});

export type InsertToken = z.infer<typeof insertTokenSchema>;
export type TokenType = mongoose.InferSchemaType<typeof tokenSchema>;
