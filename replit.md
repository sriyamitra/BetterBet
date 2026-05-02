# BetterBet

## Overview

BetterBet is a mobile-first accountability wager web app. Two friends create a challenge with a goal, wager, and duration. Both must post daily photo proof of their check-ins. Whoever fails to meet the goal owes the wager.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (mobile-first, PWA-ready)
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Object Storage**: Replit App Storage (GCS) for photo uploads
- **Auth**: Display name + 4-digit PIN (token in localStorage)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Features

1. **Auth**: Register with display name + 4-digit PIN. Token stored in localStorage.
2. **Create Challenge**: Set goal, wager, duration (days), required check-ins per week.
3. **Invite**: Challenge creator gets a short invite code. Friend joins via link or code.
4. **Daily Check-ins**: Upload photo proof from camera/gallery. Calendar shows each person's check-in history.
5. **Dashboard**: Side-by-side progress for both participants, wager prominent at top, countdown timer.
6. **Results**: Winner/loser calculation with wager outcome message.

## Data Model

- `users`: id, display_name, pin_hash, created_at
- `challenges`: id, title, goal, wager, duration_days, required_checkins_per_week, created_by, invite_code, status, start_date, end_date, created_at
- `participants`: id, challenge_id, user_id, display_name, joined_at
- `checkins`: id, challenge_id, user_id, display_name, date, photo_url, note, created_at

## API Routes

- `POST /api/auth/register` — create user
- `POST /api/auth/login` — login
- `GET /api/auth/me` — get current user
- `GET /api/challenges` — list my challenges
- `POST /api/challenges` — create challenge
- `GET /api/challenges/:id` — get challenge
- `GET /api/challenges/join/:inviteCode` — preview challenge by invite code
- `POST /api/challenges/:id/join` — join challenge
- `GET /api/challenges/:id/checkins` — list check-ins
- `POST /api/challenges/:id/checkins` — submit check-in
- `GET /api/challenges/:id/summary` — progress summary
- `POST /api/challenges/:id/upload-url` — get presigned URL for photo upload

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
