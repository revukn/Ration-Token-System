import mongoose from "mongoose";
import { z } from "zod/v4";

export const cardTypeEnum = ["BPL", "AAY", "PHH", "APL"] as const;

const familyMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  relation: { type: String, required: true },
  aadharCardNumber: { type: String, required: true, minlength: 12, maxlength: 12 },
  faceData: { type: String, default: null }
});

const rationCardSchema = new mongoose.Schema({
  rationCardNumber: { type: String, required: true, unique: true },
  holderName: { type: String, required: true },
  cardType: { type: String, enum: cardTypeEnum, required: true },
  familyMembers: [familyMemberSchema],
  address: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const RationCard = mongoose.model("RationCard", rationCardSchema);

export const insertRationCardSchema = z.object({
  rationCardNumber: z.string(),
  holderName: z.string(),
  cardType: z.enum(cardTypeEnum),
  familyMembers: z.array(z.object({
    name: z.string(),
    age: z.number(),
    relation: z.string(),
    aadharCardNumber: z.string().length(12),
    faceData: z.string().nullable().optional()
  })),
  address: z.string(),
  isActive: z.boolean().optional()
});

export type InsertRationCard = z.infer<typeof insertRationCardSchema>;
export type RationCardType = mongoose.InferSchemaType<typeof rationCardSchema>;
