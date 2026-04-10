import { pgTable, text, serial, timestamp, pgEnum, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const tokenStatusEnum = pgEnum("token_status", ["pending", "verified", "approved", "distributed"]);
export const verificationTypeEnum = pgEnum("verification_type", ["face", "otp"]);

export const tokensTable = pgTable("tokens", {
  id: serial("id").primaryKey(),
  tokenNumber: text("token_number").notNull().unique(),
  rationCardNumber: text("ration_card_number").notNull(),
  holderName: text("holder_name").notNull(),
  selectedMembers: json("selected_members").$type<string[]>().notNull(),
  verificationType: verificationTypeEnum("verification_type").notNull(),
  status: tokenStatusEnum("status").notNull().default("pending"),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTokenSchema = createInsertSchema(tokensTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokensTable.$inferSelect;
