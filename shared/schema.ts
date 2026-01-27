import { pgTable, text, serial, integer, boolean, timestamp, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

export const requestLogs = pgTable("request_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  service: text("service").notNull(),
  query: text("query").notNull(),
  status: text("status").notNull(),
  result: jsonb("result"), // Added to store results for history
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  userIdIdx: index("request_logs_user_id_idx").on(table.userId),
  createdAtIdx: index("request_logs_created_at_idx").on(table.createdAt),
  userCreatedIdx: index("request_logs_user_created_idx").on(table.userId, table.createdAt),
}));

export const protectedNumbers = pgTable("protected_numbers", {
  id: serial("id").primaryKey(),
  number: text("number").notNull().unique(),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const redeemCodes = pgTable("redeem_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  credits: integer("credits").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  usedBy: varchar("used_by").references(() => users.id),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===
export const insertRequestLogSchema = createInsertSchema(requestLogs).omit({ 
  id: true, 
  createdAt: true 
});

export const insertRedeemCodeSchema = createInsertSchema(redeemCodes).omit({
  id: true,
  createdAt: true,
  isUsed: true,
  usedBy: true,
  usedAt: true
});

export const insertProtectedNumberSchema = createInsertSchema(protectedNumbers).omit({
  id: true,
  createdAt: true
});

// === TYPES ===
export type RequestLog = typeof requestLogs.$inferSelect;
export type RedeemCode = typeof redeemCodes.$inferSelect;

// Service Request Schemas
export const mobileInfoSchema = z.object({
  number: z.string().regex(/^[0-9]{10}$/, "Must be a valid 10-digit Indian mobile number"),
});

export const aadharInfoSchema = z.object({
  number: z.string().regex(/^[0-9]{16}$/, "Must be a valid 16-digit Aadhar number"),
});

export const vehicleInfoSchema = z.object({
  number: z.string().regex(/^[A-Za-z]{2}[0-9]{2}[A-Za-z0-9]+$/, "Must start with 2 letters, 2 numbers, then alphanumeric"),
});

export const ipInfoSchema = z.object({
  ip: z.string().ip({ version: "v4", message: "Must be a valid IPv4 address" }),
});

// Response Types
export interface ServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  creditsRemaining?: number;
}
