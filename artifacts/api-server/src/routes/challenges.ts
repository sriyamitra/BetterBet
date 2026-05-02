import { Router } from "express";
import { db, challengesTable, participantsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import crypto from "crypto";
import { CreateChallengeBody } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";

const router = Router();

function generateInviteCode(): string {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function formatChallenge(c: typeof challengesTable.$inferSelect, participants: typeof participantsTable.$inferSelect[]) {
  return {
    id: c.id,
    title: c.title,
    goal: c.goal,
    wager: c.wager,
    durationDays: c.durationDays,
    requiredCheckinsPerWeek: c.requiredCheckinsPerWeek,
    createdBy: c.createdBy,
    inviteCode: c.inviteCode,
    status: c.status,
    startDate: c.startDate?.toISOString() ?? null,
    endDate: c.endDate?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    participants: participants.map(p => ({
      id: p.id,
      userId: p.userId,
      displayName: p.displayName,
      joinedAt: p.joinedAt.toISOString(),
    })),
  };
}

// GET /challenges
router.get("/challenges", requireAuth, async (req: AuthenticatedRequest, res) => {
  const myParticipations = await db
    .select()
    .from(participantsTable)
    .where(eq(participantsTable.userId, req.userId!));

  if (myParticipations.length === 0) {
    res.json([]);
    return;
  }

  const challengeIds = myParticipations.map(p => p.challengeId);
  const challenges = await db
    .select()
    .from(challengesTable)
    .where(inArray(challengesTable.id, challengeIds));

  const allParticipants = await db
    .select()
    .from(participantsTable)
    .where(inArray(participantsTable.challengeId, challengeIds));

  const result = challenges.map(c => {
    const participants = allParticipants.filter(p => p.challengeId === c.id);
    return formatChallenge(c, participants);
  });

  res.json(result);
});

// POST /challenges
router.post("/challenges", requireAuth, async (req: AuthenticatedRequest, res) => {
  const parsed = CreateChallengeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { title, goal, wager, durationDays, requiredCheckinsPerWeek } = parsed.data;
  const inviteCode = generateInviteCode();

  const [challenge] = await db.insert(challengesTable).values({
    title,
    goal,
    wager,
    durationDays,
    requiredCheckinsPerWeek,
    createdBy: req.userId!,
    inviteCode,
    status: "pending",
    startDate: new Date(),
    endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
  }).returning();

  const [participant] = await db.insert(participantsTable).values({
    challengeId: challenge.id,
    userId: req.userId!,
    displayName: req.userDisplayName!,
  }).returning();

  res.status(201).json(formatChallenge(challenge, [participant]));
});

// GET /challenges/join/:inviteCode  (must come before /:challengeId) — public, no auth required
router.get("/challenges/join/:inviteCode", async (req, res) => {
  const { inviteCode } = req.params;
  const [challenge] = await db.select().from(challengesTable).where(eq(challengesTable.inviteCode, inviteCode)).limit(1);

  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const participants = await db.select().from(participantsTable).where(eq(participantsTable.challengeId, challenge.id));
  res.json(formatChallenge(challenge, participants));
});

// GET /challenges/:challengeId
router.get("/challenges/:challengeId", requireAuth, async (req: AuthenticatedRequest, res) => {
  const challengeId = parseInt(req.params.challengeId, 10);
  if (isNaN(challengeId)) {
    res.status(400).json({ error: "Invalid challenge ID" });
    return;
  }

  const [challenge] = await db.select().from(challengesTable).where(eq(challengesTable.id, challengeId)).limit(1);
  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const participants = await db.select().from(participantsTable).where(eq(participantsTable.challengeId, challengeId));
  res.json(formatChallenge(challenge, participants));
});

// POST /challenges/:challengeId/join
router.post("/challenges/:challengeId/join", requireAuth, async (req: AuthenticatedRequest, res) => {
  const challengeId = parseInt(req.params.challengeId, 10);
  if (isNaN(challengeId)) {
    res.status(400).json({ error: "Invalid challenge ID" });
    return;
  }

  const [challenge] = await db.select().from(challengesTable).where(eq(challengesTable.id, challengeId)).limit(1);
  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const participants = await db.select().from(participantsTable).where(eq(participantsTable.challengeId, challengeId));

  const alreadyJoined = participants.some(p => p.userId === req.userId!);
  if (alreadyJoined) {
    res.status(400).json({ error: "Already joined this challenge" });
    return;
  }

  if (participants.length >= 2) {
    res.status(400).json({ error: "Challenge is already full" });
    return;
  }

  const [newParticipant] = await db.insert(participantsTable).values({
    challengeId,
    userId: req.userId!,
    displayName: req.userDisplayName!,
  }).returning();

  // Activate challenge when second person joins
  await db.update(challengesTable).set({ status: "active" }).where(eq(challengesTable.id, challengeId));

  const [updatedChallenge] = await db.select().from(challengesTable).where(eq(challengesTable.id, challengeId));
  const allParticipants = [...participants, newParticipant];

  res.json(formatChallenge(updatedChallenge, allParticipants));
});

export default router;
