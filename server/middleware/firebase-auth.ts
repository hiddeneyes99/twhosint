import admin from "firebase-admin";
import { Response, NextFunction } from "express";
import { storage } from "../storage";

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID || "osint-platform-d6b9b";
  
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
      console.log("Initializing Firebase Admin with Service Account");
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId,
      });
    } else {
      console.log("Initializing Firebase Admin with Project ID only (default credentials)");
      admin.initializeApp({
        projectId: projectId,
      });
    }
  } catch (err) {
    console.error("Firebase initialization error:", err);
    // Fallback to simple init if something fails
    admin.initializeApp({
      projectId: projectId,
    });
  }
}

export const firebaseAuthMiddleware = async (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Successfully verified token for:", decodedToken.email);
    
    // Sync with local DB to ensure user has credits/history
    try {
      let user = await storage.getUser(decodedToken.uid);
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const ipStr = Array.isArray(ip) ? ip[0] : ip;

      if (!user) {
        console.log("Creating new user in storage:", decodedToken.uid);
        user = await storage.createUser({
          id: decodedToken.uid,
          email: decodedToken.email,
          username: decodedToken.email?.split('@')[0] || 'user',
          credits: 10,
          lastIp: ipStr,
          termsAccepted: req.headers['x-terms-accepted'] === 'true',
          privacyAccepted: req.headers['x-privacy-accepted'] === 'true',
        });
      } else {
        if (user.isIpBlocked) {
          return res.status(403).json({ message: "Your IP is blocked. Contact Admin." });
        }
        
        const updates: any = { lastIp: ipStr };
        if (req.headers['x-terms-accepted'] === 'true') {
          updates.termsAccepted = true;
        }
        if (req.headers['x-privacy-accepted'] === 'true') {
          updates.privacyAccepted = true;
        }
        
        await storage.updateUser(user.id, updates);
      }
    } catch (dbError) {
      console.error("Database sync error in auth middleware:", dbError);
      // Continue even if DB sync fails, we have the firebase token
    }

    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email,
      claims: { sub: decodedToken.uid }
    };
    next();
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    res.status(401).json({ message: "Unauthorized", detail: error instanceof Error ? error.message : "Token verification failed" });
  }
};
