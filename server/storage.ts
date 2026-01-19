import { users, requestLogs, protectedNumbers, redeemCodes, type User, type UpsertUser, type RequestLog, type RedeemCode } from "@shared/schema";
import { db } from "./db";
import { eq, sql, inArray, and, gt } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deductCredit(userId: string): Promise<User>;
  logRequest(userId: string, service: string, query: string, status: string, result?: any): Promise<void>;
  getRequestHistory(userId: string): Promise<RequestLog[]>;
  isIpBlocked(ip: string): Promise<boolean>;
  blockIp(ip: string, blocked: boolean): Promise<void>;
  
  // Redeem code methods
  createRedeemCode(code: string, credits: number): Promise<RedeemCode>;
  redeemCode(code: string, userId: string): Promise<{ success: boolean; message: string; credits?: number }>;
  
  // Admin methods
  getAllUsers(): Promise<User[]>;
  updateAllUsersCredits(amount: number): Promise<void>;
  isNumberProtected(number: string): Promise<string | null>;
  addProtectedNumber(number: string, reason?: string): Promise<void>;
  removeProtectedNumber(number: string): Promise<void>;
  getProtectedNumbers(): Promise<string[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set({
      ...updates,
      updatedAt: new Date()
    }).where(eq(users.id, id)).returning();
    return user;
  }

  async deductCredit(userId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ credits: sql`${users.credits} - 1` })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async logRequest(userId: string, service: string, query: string, status: string, result?: any): Promise<void> {
    await db.insert(requestLogs).values({
      userId,
      service,
      query,
      status,
      result: result || null,
    });
  }

  async getRequestHistory(userId: string): Promise<RequestLog[]> {
    return await db
      .select()
      .from(requestLogs)
      .where(eq(requestLogs.userId, userId))
      .orderBy(sql`${requestLogs.createdAt} DESC`);
  }

  async isIpBlocked(ip: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.lastIp, ip));
    return user ? user.isIpBlocked : false;
  }

  async blockIp(ip: string, blocked: boolean): Promise<void> {
    await db.update(users).set({ isIpBlocked: blocked }).where(eq(users.lastIp, ip));
  }

  async createRedeemCode(code: string, credits: number): Promise<RedeemCode> {
    const [redeemCode] = await db.insert(redeemCodes).values({
      code,
      credits,
    }).returning();
    return redeemCode;
  }

  async redeemCode(code: string, userId: string): Promise<{ success: boolean; message: string; credits?: number }> {
    const [redeemCode] = await db.select().from(redeemCodes).where(and(eq(redeemCodes.code, code), eq(redeemCodes.isUsed, false)));
    
    if (!redeemCode) {
      return { success: false, message: "Invalid or already used code" };
    }

    const [user] = await db.update(users)
      .set({ 
        credits: sql`${users.credits} + ${redeemCode.credits}`,
      })
      .where(eq(users.id, userId))
      .returning();

    await db.update(redeemCodes)
      .set({ isUsed: true, usedBy: userId, usedAt: new Date() })
      .where(eq(redeemCodes.id, redeemCode.id));

    return { success: true, message: `Successfully redeemed ${redeemCode.credits} credits!`, credits: user.credits };
  }

  // Admin Implementation
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateAllUsersCredits(amount: number): Promise<void> {
    await db.update(users).set({ 
      credits: sql`${users.credits} + ${amount}`,
    });
  }

  async isNumberProtected(number: string): Promise<string | null> {
    const [protectedNum] = await db.select().from(protectedNumbers).where(eq(protectedNumbers.number, number));
    return protectedNum ? protectedNum.reason || "BAAP KA RAAZ HAI" : null;
  }

  async addProtectedNumber(number: string, reason?: string): Promise<void> {
    await db.insert(protectedNumbers).values({ number, reason }).onConflictDoNothing();
  }

  async removeProtectedNumber(number: string): Promise<void> {
    await db.delete(protectedNumbers).where(eq(protectedNumbers.number, number));
  }

  async getProtectedNumbers(): Promise<string[]> {
    const results = await db.select({ number: protectedNumbers.number }).from(protectedNumbers);
    return results.map(r => r.number);
  }
}

export const storage = new DatabaseStorage();
