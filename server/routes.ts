import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import compression from "compression";
import { api } from "@shared/routes";
import {
  mobileInfoSchema,
  aadharInfoSchema,
  vehicleInfoSchema,
  ipInfoSchema,
  users,
} from "@shared/schema";
import { z } from "zod";
import { firebaseAuthMiddleware as requireAuth } from "./middleware/firebase-auth";
import { sql } from "drizzle-orm";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  app.use(compression());
  // === API ROUTES ===
  const handleServiceRequest = async (
    req: any,
    res: any,
    serviceName: string,
    query: string,
    apiCallback: () => Promise<any>,
  ) => {
    try {
      const user = await storage.getUser(req.user.id);
      const settings = await storage.getSettings();

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (user.isBlocked) {
        return res.status(403).json({ message: "Your account is restricted. Contact admin to resolve: https://t.me/Twhosint" });
      }

      if (user.isIpBlocked) {
        return res.status(403).json({ message: "Your IP is restricted. Contact admin to resolve: https://t.me/Twhosint" });
      }

      const protectionReason = await storage.isNumberProtected(query);
      if (protectionReason) {
        return res.status(403).json({ 
          message: "This number is protected", 
          reason: protectionReason 
        });
      }

      // Check Cache first
      const cachedResult = await storage.getCachedRequest(serviceName, query);
      if (cachedResult && cachedResult.result) {
        console.log(`Serving cached result for ${serviceName}: ${query}`);
        return res.json({
          success: true,
          data: cachedResult.result,
          creditsRemaining: user.credits,
          cached: true
        });
      }

      const serviceCosts = settings.serviceCosts as Record<string, number>;
      const cost = serviceCosts[serviceName] ?? 1;

      if (user.credits < cost) {
        await storage.logRequest(
          user.id,
          serviceName,
          query,
          "FAILED_NO_CREDITS",
        );
        return res.status(402).json({
          message: "Insufficient credits",
          credits: user.credits,
        });
      }

      // Execute API call with retry logic
      let data;
      let attempts = 0;
      const maxRetries = 10;
      let lastError = null;

      while (attempts < maxRetries) {
        attempts++;
        try {
          data = await apiCallback();
          
          if (data && data.error) {
            const errorMsg = String(data.error).toLowerCase();
            
            // If "not found", don't retry, just return
            if (errorMsg.includes("not found") || errorMsg.includes("no data")) {
              return res.status(404).json({ message: data.error || "Data not found" });
            }
            
            // If "internal error", retry
            if (errorMsg.includes("internal error") || errorMsg.includes("server error")) {
              console.log(`Attempt ${attempts} failed with internal error for ${serviceName}: ${query}. Retrying...`);
              lastError = data.error;
              if (attempts < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
                continue;
              }
            }
            
            // Other errors, don't retry
            return res.status(400).json({ message: data.error });
          }
          
          // Success! Break the loop
          break;
        } catch (error: any) {
          const errorMsg = error.message?.toLowerCase() || "";
          console.error(`Attempt ${attempts} exception for ${serviceName}:`, error);
          
          lastError = error.message;
          
          // Retry on specific exceptions if needed, or all exceptions up to limit
          if (attempts < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          
          return res.status(500).json({ 
            message: error.message || "External API failed",
            attempts 
          });
        }
      }

      if (!data) {
        return res.status(500).json({ 
          message: lastError || "Failed after maximum retries",
          attempts 
        });
      }

      // Deduct credit and log request
      const updatedUser = await storage.deductCredit(user.id, cost);
      await storage.logRequest(user.id, serviceName, query, "SUCCESS", data);

      res.json({
        success: true,
        data,
        creditsRemaining: updatedUser.credits,
      });
    } catch (error) {
      console.error("Service Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  // === API ROUTES ===

  app.get("/api/auth/user", requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.user.me.path, requireAuth, async (req: any, res) => {
    const user = await storage.getUser(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({
      id: user.id,
      username: user.username || user.email || "Unknown",
      credits: user.credits,
    });
  });

  // 1. Mobile Info
  app.post(api.services.mobile.path, requireAuth, async (req, res) => {
    const result = mobileInfoSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid mobile number" });
    }

    await handleServiceRequest(
      req,
      res,
      "mobile",
      result.data.number,
      async () => {
        const apiUrl = `https://numinfo.asapiservices.workers.dev/mobile-lookup?key=anshapipro&mobile=${result.data.number}`;
        console.log(`Executing Mobile API: ${apiUrl.split('key=')[0]}key=***`);
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error("Mobile API failed");
        }
        const data = await response.json();
        console.log("Mobile API Response Data:", JSON.stringify(data).substring(0, 500));
        return data;
      },
    );
  });

  // 2. Aadhar Info
  app.post(api.services.aadhar.path, requireAuth, async (req, res) => {
    const result = aadharInfoSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid Aadhar number" });
    }

    await handleServiceRequest(
      req,
      res,
      "aadhar",
      result.data.number,
      async () => {
        const apiUrl = process.env.AADHAR_API_URL;
        if (apiUrl && apiUrl !== "MOCK_AADHAR_API") {
          const formattedUrl = apiUrl.replace("{query}", result.data.number);
          const response = await fetch(formattedUrl);
          if (response.ok) return await response.json();
        }
        // Mock Data as per instruction (API not provided)
        return {
          number: "XXXX-XXXX-" + result.data.number.slice(-4),
          status: "Active",
          age_band: "20-30",
          state: "Maharashtra",
          gender: "Male",
        };
      },
    );
  });

  // 3. Vehicle Info
  app.post(api.services.vehicle.path, requireAuth, async (req, res) => {
    const result = vehicleInfoSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid vehicle number" });
    }

    await handleServiceRequest(
      req,
      res,
      "vehicle",
      result.data.number,
      async () => {
        const apiUrl = (process.env.VEHICLE_API_URL || "https://vehicle-infoo.vercel.app/?rc_number={query}")
          .replace("{query}", result.data.number);
        const response = await fetch(apiUrl);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Vehicle API failed: ${errorText || response.statusText}`,
          );
        }
        return await response.json();
      },
    );
  });

  // 4. IP Info
  app.post(api.services.ip.path, requireAuth, async (req, res) => {
    const result = ipInfoSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid IP address" });
    }

    await handleServiceRequest(req, res, "ip", result.data.ip, async () => {
      const apiUrl = (process.env.IP_API_URL || "http://ip-api.com/json/{query}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query")
        .replace("{query}", result.data.ip);
      const response = await fetch(apiUrl);
      if (!response.ok) {
        // Fallback to ipapi.co
        const fallback = await fetch(`https://ipapi.co/${result.data.ip}/json/`);
        if (!fallback.ok) throw new Error("IP API failed");
        return await fallback.json();
      }
      return await response.json();
    });
  });

  app.get(api.user.history.path, requireAuth, async (req: any, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Default 10, max 50
    const offset = (page - 1) * limit;
    
    const history = await storage.getRequestHistory(req.user.id, limit, offset);
    res.json({
      data: history,
      page,
      limit,
      hasMore: history.length === limit // If we got full limit, there might be more
    });
  });

  app.post("/api/user/redeem", requireAuth, async (req: any, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Code is required" });
    const result = await storage.redeemCode(code, req.user.id);
    if (!result.success) return res.status(400).json({ message: result.message });
    res.json(result);
  });

  // === SECURE ADMIN ROUTES ===
  const requireAdminSession = (req: any, res: any, next: any) => {
    if (!(req as any).session.isAdmin) {
      return res.status(401).json({ message: "Admin access required" });
    }
    next();
  };

  app.post("/api/admin/login", (req, res) => {
    const { id, password } = req.body;
    console.log("Admin login attempt with ID:", id);
    if (
      id === process.env.ADMIN_SECRET_ID && 
      password === process.env.ADMIN_SECRET_PASS
    ) {
      console.log("Admin credentials matched. Setting session.");
      if ((req as any).session) {
        (req as any).session.isAdmin = true;
        res.json({ success: true });
      } else {
        console.error("Session object missing from request");
        res.status(500).json({ message: "Session configuration error" });
      }
    } else {
      console.log("Admin credentials mismatch");
      res.status(401).json({ message: "Invalid clearance code" });
    }
  });

  app.get("/api/admin/users", requireAdminSession, async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post("/api/admin/users/:id/credits", requireAdminSession, async (req, res) => {
    const { credits } = req.body;
    if (typeof credits !== 'number') {
      return res.status(400).json({ message: "Invalid credits amount" });
    }
    const user = await storage.updateUser(req.params.id, { credits });
    res.json(user);
  });

  app.get("/api/admin/users/:id/history", requireAdminSession, async (req: any, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50); // Default 10, max 50
    const offset = (page - 1) * limit;
    
    const history = await storage.getRequestHistory(req.params.id, limit, offset);
    res.json({
      data: history,
      page,
      limit,
      hasMore: history.length === limit
    });
  });

  app.post("/api/admin/users/:id/block", requireAdminSession, async (req, res) => {
    const { blocked, blockIp } = req.body;
    const user = await storage.updateUser(req.params.id, { 
      isBlocked: blocked,
      isIpBlocked: blockIp !== undefined ? blockIp : undefined
    });
    res.json(user);
  });

  app.get("/api/admin/protected-numbers", requireAdminSession, async (req, res) => {
    const numbers = await storage.getProtectedNumbers();
    res.json(numbers);
  });

  app.post("/api/admin/protected-numbers", requireAdminSession, async (req, res) => {
    const { number, reason } = req.body;
    if (!number) {
      return res.status(400).json({ message: "Number is required" });
    }
    await storage.addProtectedNumber(number, reason);
    res.json({ success: true });
  });

  app.delete("/api/admin/protected-numbers/:number", requireAdminSession, async (req, res) => {
    await storage.removeProtectedNumber(req.params.number);
    res.json({ success: true });
  });

  app.post("/api/admin/generate-code", requireAdminSession, async (req, res) => {
    const { credits } = req.body;
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const redeemCode = await storage.createRedeemCode(code, credits);
    res.json(redeemCode);
  });

  app.post("/api/admin/gift-all", requireAdminSession, async (req, res) => {
    const { credits } = req.body;
    await storage.updateAllUsersCredits(credits);
    res.json({ success: true });
  });

  app.post("/api/admin/broadcast", requireAdminSession, async (req, res) => {
    const broadcast = await storage.createBroadcast(req.body);
    res.json(broadcast);
  });

  app.post("/api/admin/broadcast/:id/stop", requireAdminSession, async (req, res) => {
    await storage.stopBroadcast(parseInt(req.params.id));
    res.json({ success: true });
  });

  app.get("/api/broadcast/active", async (req, res) => {
    const broadcast = await storage.getActiveBroadcast();
    res.json(broadcast || null);
  });

  app.get("/api/admin/settings", requireAdminSession, async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  app.post("/api/admin/settings", requireAdminSession, async (req, res) => {
    const settings = await storage.updateSettings(req.body);
    res.json(settings);
  });

  return httpServer;
}
