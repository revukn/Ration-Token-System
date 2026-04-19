import mongoose from "mongoose";
import { z } from "zod/v4";

export const userRoleEnum = ["user", "admin"] as const;

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rationCardNumber: { type: String, required: true, unique: true },
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
  role: z.enum(userRoleEnum).optional()
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserType = mongoose.InferSchemaType<typeof userSchema>;
