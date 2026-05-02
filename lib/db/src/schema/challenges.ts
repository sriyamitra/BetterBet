import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const challengeStatusEnum = pgEnum("challenge_status", [
  "pending",
  "active",
  "completed",
  "cancelled",
]);

export const challengesTable = pgTable("challenges", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  goal: text("goal").notNull(),
  wager: text("wager").notNull(),
  durationDays: integer("duration_days").notNull(),
  requiredCheckinsPerWeek: integer("required_checkins_per_week").notNull(),
  createdBy: integer("created_by").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  status: challengeStatusEnum("status").notNull().default("pending"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertChallengeSchema = createInsertSchema(challengesTable).omit({
  id: true,
  createdAt: true,
  status: true,
  startDate: true,
  endDate: true,
});
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type Challenge = typeof challengesTable.$inferSelect;
