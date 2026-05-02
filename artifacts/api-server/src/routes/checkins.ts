import { Router } from "express";
import { db, checkinsTable, challengesTable, participantsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateCheckinBody, GetUploadUrlBody } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../lib/auth";
import { ObjectStorageService } from "../lib/objectStorage";

const router = Router();
const storageService = new ObjectStorageService();

// GET /challenges/:challengeId/checkins
router.get("/challenges/:challengeId/checkins", requireAuth, async (req: AuthenticatedRequest, res) => {
  const challengeId = parseInt(req.params.challengeId, 10);
  if (isNaN(challengeId)) {
    res.status(400).json({ error: "Invalid challenge ID" });
    return;
  }

  const checkins = await db
    .select()
    .from(checkinsTable)
    .where(eq(checkinsTable.challengeId, challengeId));

  res.json(checkins.map(c => ({
    id: c.id,
    challengeId: c.challengeId,
    userId: c.userId,
    displayName: c.displayName,
    date: c.date,
    photoUrl: c.photoUrl,
    note: c.note,
    createdAt: c.createdAt.toISOString(),
  })));
});

// POST /challenges/:challengeId/checkins
router.post("/challenges/:challengeId/checkins", requireAuth, async (req: AuthenticatedRequest, res) => {
  const challengeId = parseInt(req.params.challengeId, 10);
  if (isNaN(challengeId)) {
    res.status(400).json({ error: "Invalid challenge ID" });
    return;
  }

  const parsed = CreateCheckinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const { date, photoUrl, note } = parsed.data;

  // Check participant
  const [participant] = await db
    .select()
    .from(participantsTable)
    .where(and(
      eq(participantsTable.challengeId, challengeId),
      eq(participantsTable.userId, req.userId!)
    ))
    .limit(1);

  if (!participant) {
    res.status(400).json({ error: "You are not a participant in this challenge" });
    return;
  }

  // Check if already checked in today
  const [existing] = await db
    .select()
    .from(checkinsTable)
    .where(and(
      eq(checkinsTable.challengeId, challengeId),
      eq(checkinsTable.userId, req.userId!),
      eq(checkinsTable.date, date)
    ))
    .limit(1);

  if (existing) {
    res.status(400).json({ error: "Already checked in for this date" });
    return;
  }

  const [checkin] = await db.insert(checkinsTable).values({
    challengeId,
    userId: req.userId!,
    displayName: req.userDisplayName!,
    date,
    photoUrl: photoUrl ?? null,
    note: note ?? null,
  }).returning();

  res.status(201).json({
    id: checkin.id,
    challengeId: checkin.challengeId,
    userId: checkin.userId,
    displayName: checkin.displayName,
    date: checkin.date,
    photoUrl: checkin.photoUrl,
    note: checkin.note,
    createdAt: checkin.createdAt.toISOString(),
  });
});

// GET /challenges/:challengeId/summary
router.get("/challenges/:challengeId/summary", requireAuth, async (req: AuthenticatedRequest, res) => {
  const challengeId = parseInt(req.params.challengeId, 10);
  if (isNaN(challengeId)) {
    res.status(400).json({ error: "Invalid challenge ID" });
    return;
  }

  const [challenge] = await db
    .select()
    .from(challengesTable)
    .where(eq(challengesTable.id, challengeId))
    .limit(1);

  if (!challenge) {
    res.status(404).json({ error: "Challenge not found" });
    return;
  }

  const participants = await db
    .select()
    .from(participantsTable)
    .where(eq(participantsTable.challengeId, challengeId));

  const checkins = await db
    .select()
    .from(checkinsTable)
    .where(eq(checkinsTable.challengeId, challengeId));

  const totalWeeks = Math.ceil(challenge.durationDays / 7);
  const totalRequiredCheckins = totalWeeks * challenge.requiredCheckinsPerWeek;

  // Calculate days remaining
  const endDate = challenge.endDate ?? new Date(challenge.createdAt.getTime() + challenge.durationDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  // Current week boundaries
  const startOfWeek = new Date();
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const progress = participants.map(p => {
    const userCheckins = checkins.filter(c => c.userId === p.userId);
    const checkinDates = userCheckins.map(c => c.date);

    // Current week check-ins
    const currentWeekCheckins = userCheckins.filter(c => {
      const d = new Date(c.date);
      return d >= startOfWeek;
    }).length;

    // Calculate streak
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    let checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (checkinDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr === today) {
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    const metGoal = daysRemaining === 0 && userCheckins.length >= totalRequiredCheckins;

    return {
      userId: p.userId,
      displayName: p.displayName,
      totalCheckins: userCheckins.length,
      requiredCheckins: totalRequiredCheckins,
      currentWeekCheckins,
      requiredPerWeek: challenge.requiredCheckinsPerWeek,
      metGoal,
      streak,
      checkinDates,
    };
  });

  // Determine winner if challenge is over
  let winner: string | null = null;
  let outcome: string | null = null;

  if (daysRemaining === 0 || challenge.status === "completed") {
    const winners = progress.filter(p => p.metGoal);
    const losers = progress.filter(p => !p.metGoal);

    if (winners.length === progress.length) {
      outcome = "both_won";
      winner = null;
    } else if (losers.length === progress.length) {
      outcome = "both_lost";
      winner = null;
    } else {
      outcome = "winner";
      winner = winners[0]?.displayName ?? null;
    }
  }

  res.json({
    challenge: {
      id: challenge.id,
      title: challenge.title,
      goal: challenge.goal,
      wager: challenge.wager,
      durationDays: challenge.durationDays,
      requiredCheckinsPerWeek: challenge.requiredCheckinsPerWeek,
      createdBy: challenge.createdBy,
      inviteCode: challenge.inviteCode,
      status: challenge.status,
      startDate: challenge.startDate?.toISOString() ?? null,
      endDate: challenge.endDate?.toISOString() ?? null,
      createdAt: challenge.createdAt.toISOString(),
      participants: participants.map(p => ({
        id: p.id,
        userId: p.userId,
        displayName: p.displayName,
        joinedAt: p.joinedAt.toISOString(),
      })),
    },
    progress,
    daysRemaining,
    winner,
    outcome,
  });
});

// POST /challenges/:challengeId/upload-url
router.post("/challenges/:challengeId/upload-url", requireAuth, async (req: AuthenticatedRequest, res) => {
  const challengeId = parseInt(req.params.challengeId, 10);
  if (isNaN(challengeId)) {
    res.status(400).json({ error: "Invalid challenge ID" });
    return;
  }

  const parsed = GetUploadUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  const uploadUrl = await storageService.getObjectEntityUploadURL();
  const publicUrl = uploadUrl.split("?")[0];

  res.json({ uploadUrl, publicUrl });
});

export default router;
