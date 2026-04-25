import mongoose from "mongoose";
import { z } from "zod/v4";

export const userRoleEnum = ["user", "admin"] as const;
export const rationCardTypeEnum = ["AAY", "BPL", "PHH", "APL"] as const;

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rationCardNumber: { type: String, required: true, unique: true },
  rationCardType: { 
    type: String, 
    enum: rationCardTypeEnum, 
    required: true,
    default: 'BPL'
  },
  fairPriceShop: { type: String, default: "FPS-001" },
  familyMemberDetails: [{ 
    name: { type: String, required: true },
    age: { type: Number, required: true },
    relation: { type: String, required: true },
    isPrimary: { type: Boolean, default: false } 
  }],
  role: { type: String, enum: userRoleEnum, default: "user" },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.model("User", userSchema);

export const insertUserSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  password: z.string(),
  rationCardNumber: z.string(),
  rationCardType: z.enum(rationCardTypeEnum).optional(),
  fairPriceShop: z.string().optional(),
  familyMemberDetails: z.array(z.object({
    name: z.string(),
    age: z.number(),
    relation: z.string(),
    isPrimary: z.boolean().optional()
  })).optional(),
  role: z.enum(userRoleEnum).optional()
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserType = mongoose.InferSchemaType<typeof userSchema>;
