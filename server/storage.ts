import { users, requestLogs, protectedNumbers, redeemCodes, broadcastMessages, appSettings, type User, type UpsertUser, type RequestLog, type RedeemCode, type BroadcastMessage, type AppSettings } from "@shared/schema";
import { db } from "./db";
import { eq, sql, inArray, and, gt, lt, or, isNull } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  deductCredit(userId: string): Promise<User>;
  logRequest(userId: string, service: string, query: string, status: string, result?: any): Promise<void>;
  getRequestHistory(userId: string, limit?: number, offset?: number): Promise<RequestLog[]>;
  isIpBlocked(ip: string): Promise<boolean>;
  blockIp(ip: string, blocked: boolean): Promise<void>;
  
  // Redeem code methods
  createRedeemCode(code: string, credits: number): Promise<RedeemCode>;
  redeemCode(code: string, userId: string): Promise<{ success: boolean; message: string; credits?: number }>;
  
  // Broadcast methods
  createBroadcast(data: any): Promise<BroadcastMessage>;
  stopBroadcast(id: number): Promise<void>;
  getActiveBroadcast(): Promise<BroadcastMessage | undefined>;

  // Admin methods
  getAllUsers(): Promise<User[]>;
  updateAllUsersCredits(amount: number): Promise<void>;
  isNumberProtected(number: string): Promise<string | null>;
  addProtectedNumber(number: string, reason?: string): Promise<void>;
  removeProtectedNumber(number: string): Promise<void>;
  getProtectedNumbers(): Promise<string[]>;
  
  // Settings methods
  getSettings(): Promise<AppSettings>;
  updateSettings(settings: Partial<AppSettings>): Promise<AppSettings>;
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

  async deductCredit(userId: string, amount: number = 1): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ credits: sql`${users.credits} - ${amount}` })
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

  async getRequestHistory(userId: string, limit: number = 20, offset: number = 0): Promise<RequestLog[]> {
    return await db
      .select()
      .from(requestLogs)
      .where(eq(requestLogs.userId, userId))
      .orderBy(sql`${requestLogs.createdAt} DESC`)
      .limit(limit)
      .offset(offset);
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

  // Broadcast Implementation
  async createBroadcast(data: any): Promise<BroadcastMessage> {
    // Deactivate all others
    await db.update(broadcastMessages).set({ isActive: false });
    
    const [broadcast] = await db.insert(broadcastMessages).values({
      ...data,
      isActive: true,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
    }).returning();
    return broadcast;
  }

  async stopBroadcast(id: number): Promise<void> {
    await db.update(broadcastMessages)
      .set({ isActive: false })
      .where(eq(broadcastMessages.id, id));
  }

  async getActiveBroadcast(): Promise<BroadcastMessage | undefined> {
    const now = new Date();
    const [broadcast] = await db.select()
      .from(broadcastMessages)
      .where(and(
        eq(broadcastMessages.isActive, true),
        or(
          isNull(broadcastMessages.expiresAt),
          gt(broadcastMessages.expiresAt, now)
        )
      ));
    return broadcast;
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

  async getSettings(): Promise<AppSettings> {
    const [settings] = await db.select().from(appSettings).limit(1);
    if (!settings) {
      const [newSettings] = await db.insert(appSettings).values({
        freeCreditsOnSignup: 10,
        serviceCosts: {
          mobile: 1,
          vehicle: 1,
          ip: 1,
          aadhar: 1
        },
      }).returning();
      return newSettings;
    }
    return settings;
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const settings = await this.getSettings();
    const [updated] = await db.update(appSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appSettings.id, settings.id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
