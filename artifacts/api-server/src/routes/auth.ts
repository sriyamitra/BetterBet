import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";
import { hashPin, generateToken, requireAuth, type AuthenticatedRequest } from "../lib/auth";

const router = Router();

// POST /auth/register
router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { displayName, pin } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.displayName, displayName)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "Display name already taken" });
    return;
  }

  const pinHash = hashPin(pin);
  const [user] = await db.insert(usersTable).values({ displayName, pinHash }).returning();

  const token = generateToken(user.id);
  res.status(201).json({
    user: { id: user.id, displayName: user.displayName, createdAt: user.createdAt.toISOString() },
    token,
  });
});

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { displayName, pin } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.displayName, displayName)).limit(1);

  if (!user || user.pinHash !== hashPin(pin)) {
    res.status(401).json({ error: "Invalid display name or PIN" });
    return;
  }

  const token = generateToken(user.id);
  res.status(200).json({
    user: { id: user.id, displayName: user.displayName, createdAt: user.createdAt.toISOString() },
    token,
  });
});

// GET /auth/me
router.get("/auth/me", requireAuth, async (req: AuthenticatedRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ id: user.id, displayName: user.displayName, createdAt: user.createdAt.toISOString() });
});

export default router;
