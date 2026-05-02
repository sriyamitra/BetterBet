import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin + "betterbet-salt").digest("hex");
}

export function generateToken(userId: number): string {
  const payload = `${userId}:${Date.now()}:${crypto.randomBytes(16).toString("hex")}`;
  return Buffer.from(payload).toString("base64url");
}

export function parseToken(token: string): number | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [userIdStr] = decoded.split(":");
    const userId = parseInt(userIdStr, 10);
    return isNaN(userId) ? null : userId;
  } catch {
    return null;
  }
}

export interface AuthenticatedRequest extends Request {
  userId?: number;
  userDisplayName?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  const userId = parseToken(token);

  if (!userId) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  req.userId = user.id;
  req.userDisplayName = user.displayName;
  next();
}
