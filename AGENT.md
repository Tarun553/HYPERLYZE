# 🤖 AI GitHub PR Reviewer — MVP Agent Plan

> Ship in 1 day. Senior-engineer-quality automated PR reviews powered by LLM.

---

## Tech Stack (Final, Revised)

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack, file-based routing, server actions |
| Language | TypeScript (strict mode) | End-to-end type safety |
| Auth | Clerk | GitHub OAuth out of the box, webhook-safe |
| Database | PostgreSQL via Prisma | Relational, audit-friendly |
| Cache / Queue | Redis + BullMQ | Job queue for PR review processing |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent UI |
| GitHub Integration | Octokit + GitHub Webhooks | Official SDK |
| LLM | gemini (gemini SDK) or OpenAI | Pluggable |
| Deployment | Vercel (frontend) + Railway/Render (worker) | Fast deploy |

### ⚠️ Tech Stack Changes from Your Proposal
- **Express → Next.js API Routes + Server Actions**: No separate Express server needed. Next.js handles webhook endpoints and API routes natively, reducing complexity for a 1-day build.
- **Keep Redis + BullMQ**: Critical. PR reviews are async — never block the webhook response. BullMQ worker handles the heavy lifting.
- **Add Octokit**: GitHub's official SDK — handles auth, rate limits, and API calls cleanly.

---

## Minimum Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Linked GitHub installations (via GitHub App)
model Installation {
  id            String   @id @default(cuid())
  installationId Int     @unique   // GitHub App installation ID
  accountLogin  String             // GitHub org or user login
  accountType   String             // "Organization" | "User"
  userId        String             // Clerk user ID who installed
  createdAt     DateTime @default(now())
  repos         Repo[]
  reviews       Review[]
}

// Repos the app has access to
model Repo {
  id             String       @id @default(cuid())
  installationId String
  installation   Installation @relation(fields: [installationId], references: [id])
  repoId         Int          @unique  // GitHub repo ID
  fullName       String                // e.g. "org/repo-name"
  isActive       Boolean      @default(true)
  createdAt      DateTime     @default(now())
  reviews        Review[]
}

// One review per PR (can have multiple runs if re-triggered)
model Review {
  id             String       @id @default(cuid())
  installationId String
  installation   Installation @relation(fields: [installationId], references: [id])
  repoId         String
  repo           Repo         @relation(fields: [repoId], references: [id])
  prNumber       Int
  prTitle        String
  prAuthor       String
  headSha        String
  status         ReviewStatus @default(PENDING)
  llmModel       String       @default("gemini-sonnet-4-5")
  tokensUsed     Int?
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  comments       ReviewComment[]

  @@unique([repoId, prNumber, headSha])
}

// Individual line comments posted to GitHub
model ReviewComment {
  id         String   @id @default(cuid())
  reviewId   String
  review     Review   @relation(fields: [reviewId], references: [id])
  path       String             // file path
  line       Int                // line number
  body       String             // comment text
  severity   String             // "info" | "warning" | "critical"
  githubCommentId Int?           // ID returned from GitHub API after posting
  createdAt  DateTime @default(now())
}

enum ReviewStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

**That's it — 5 tables. No over-engineering.**

---

## Project Structure

```
/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/page.tsx
│   │   └── sign-up/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              # Sidebar + auth guard
│   │   ├── dashboard/page.tsx      # Overview: recent reviews, stats
│   │   ├── repos/page.tsx          # Manage connected repos
│   │   └── reviews/
│   │       ├── page.tsx            # All reviews list
│   │       └── [id]/page.tsx       # Single review detail + comments
│   ├── api/
│   │   ├── webhooks/
│   │   │   └── github/route.ts     # GitHub webhook receiver
│   │   └── github/
│   │       └── callback/route.ts   # GitHub App install callback
│   └── layout.tsx
│
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── review-card.tsx
│   ├── comment-list.tsx
│   ├── repo-toggle.tsx
│   └── stats-bar.tsx
│
├── lib/
│   ├── prisma.ts                   # Prisma client singleton
│   ├── redis.ts                    # Redis client singleton
│   ├── queue.ts                    # BullMQ queue definition
│   ├── github.ts                   # Octokit helpers
│   ├── llm.ts                      # LLM call + prompt
│   └── utils.ts                    # cn(), formatters
│
├── worker/
│   └── review-worker.ts            # BullMQ worker (separate process)
│
├── prisma/
│   └── schema.prisma
│
├── types/
│   └── index.ts                    # Shared TypeScript types
│
├── .env.local
└── package.json
```

---

## Data Flow (The Core Loop)

```
GitHub PR Opened/Synced
        │
        ▼
POST /api/webhooks/github
        │
   Verify signature
        │
   Save Review(PENDING) to DB
        │
   Enqueue job → BullMQ (Redis)
        │
   Return 200 immediately ← GitHub needs fast response
        │
        ▼
BullMQ Worker picks up job
        │
   Fetch PR diff via Octokit
        │
   Build prompt with diff + context
        │
   Call LLM (gemini/OpenAI)
        │
   Parse structured response
        │
   POST review comments to GitHub
        │
   Save ReviewComment[] to DB
        │
   Update Review status → COMPLETED
        │
        ▼
Dashboard shows results in real-time
```

---

## Build Phases (1-Day Sprint)

### Phase 1 — Foundation (2 hours)
- [ ] `npx create-next-app@latest` with TypeScript + Tailwind
- [ ] Install deps: `@clerk/nextjs prisma @prisma/client @octokit/rest bullmq ioredis @gemini-ai/sdk`
- [ ] `npx prisma init` → write schema → `npx prisma db push`
- [ ] Clerk setup: `.env.local`, middleware, layout wrappers
- [ ] `lib/prisma.ts`, `lib/redis.ts`, `lib/queue.ts` singletons

### Phase 2 — GitHub Integration (2 hours)
- [ ] Create GitHub App (not OAuth App) in GitHub Developer Settings
  - Permissions: `pull_requests: write`, `contents: read`
  - Subscribe to: `pull_request` events
  - Set webhook URL to your ngrok/Vercel URL
- [ ] `app/api/webhooks/github/route.ts` — receive, verify HMAC, enqueue
- [ ] `lib/github.ts` — `fetchPRDiff(installationId, owner, repo, prNumber)`
- [ ] Save `Installation` + `Repo` on install webhook event

### Phase 3 — LLM Review Engine (2 hours)
- [ ] `lib/llm.ts` — build diff prompt, call gemini, parse response
- [ ] `worker/review-worker.ts` — BullMQ processor: diff → LLM → GitHub comments
- [ ] Prompt engineering: instruct model to return structured JSON with file, line, severity, comment
- [ ] Post review via `octokit.pulls.createReview()` with comments array

### Phase 4 — Dashboard UI (2 hours)
- [ ] `app/(dashboard)/dashboard/page.tsx` — stats: total reviews, open PRs, repos
- [ ] `app/(dashboard)/reviews/page.tsx` — table of all reviews with status badges
- [ ] `app/(dashboard)/reviews/[id]/page.tsx` — PR detail, comments grouped by file
- [ ] `app/(dashboard)/repos/page.tsx` — toggle active/inactive per repo
- [ ] Install GitHub App button → redirects to GitHub App install URL

### Phase 5 — Polish + Deploy (1 hour)
- [ ] Error handling: failed jobs → Review.status = FAILED, retry logic in BullMQ
- [ ] Deploy Next.js to Vercel, worker to Railway (separate `npm run worker` script)
- [ ] Set all env vars in Vercel + Railway dashboards
- [ ] Test end-to-end with a real PR

---

## Key Implementation Details

### Webhook Route (app/api/webhooks/github/route.ts)
```typescript
import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { reviewQueue } from "@/lib/queue";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("x-hub-signature-256") ?? "";
  const event = req.headers.get("x-github-event") ?? "";

  // Verify HMAC
  const expected = `sha256=${crypto
    .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex")}`;
  if (sig !== expected) return new Response("Unauthorized", { status: 401 });

  const payload = JSON.parse(body);

  if (event === "pull_request" && ["opened", "synchronize"].includes(payload.action)) {
    // Save to DB
    const review = await prisma.review.create({ data: { ... } });
    // Enqueue for async processing
    await reviewQueue.add("review-pr", { reviewId: review.id, ... });
  }

  return new Response("OK", { status: 200 });
}
```

### LLM Prompt Strategy (lib/llm.ts)
```typescript
const SYSTEM_PROMPT = `You are a senior software engineer doing a thorough PR review.
Analyze the diff and return a JSON array of review comments.
Each comment must have: { path, line, severity, body }
severity: "info" | "warning" | "critical"
Focus on: bugs, security issues, performance, readability, missing error handling.
Be concise, constructive, and specific. Skip trivial style nits.`;
```

### BullMQ Worker (worker/review-worker.ts)
```typescript
import { Worker } from "bullmq";
import { connection } from "@/lib/redis";

const worker = new Worker("review-queue", async (job) => {
  const { reviewId, installationId, owner, repo, prNumber, headSha } = job.data;
  // 1. Fetch diff
  // 2. Call LLM
  // 3. Post comments to GitHub
  // 4. Update DB
}, { connection });
```

---

## Environment Variables

```bash
# .env.local

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://localhost:6379

# GitHub App
GITHUB_APP_ID=
GITHUB_APP_PRIVATE_KEY=       # PEM, base64 encoded
GITHUB_WEBHOOK_SECRET=
NEXT_PUBLIC_GITHUB_APP_NAME=  # for install link

# LLM
gemini_API_KEY=
```

---

## GitHub App vs OAuth App

**Use a GitHub App**, not OAuth. Reasons:
- Acts as a bot (not on behalf of a user)
- Posts comments as "your-bot[bot]"
- Installation-level auth (works for orgs)
- Fine-grained permissions per repo

---

## Coding Standards

- **All files TypeScript** — no `.js` anywhere
- **Functional components only** — no class components
- **async/await** — no `.then()` chains
- **Explicit return types** on all functions
- **Zod** for runtime validation of webhook payloads
- **Server components** by default, client components only when needed (`"use client"`)
- **Error boundaries** on all page-level components
- **`cn()` from `clsx/tailwind-merge`** for conditional classNames

---

## Shadcn Components to Install

```bash
npx shadcn@latest add badge button card dialog skeleton table tabs toast
```

---

## What's NOT in MVP (Cut for Day 1)

- Email notifications
- Custom review rules / configuration per repo
- Re-review button (manual trigger)
- PR summary (only inline comments in MVP)
- Billing / usage limits
- Team management / multi-user orgs
- Webhook delivery logs UI

---

## Definition of Done (MVP)

- [ ] GitHub App installs via one click
- [ ] PR opened → webhook received → job queued
- [ ] LLM generates review comments
- [ ] Comments posted to GitHub PR automatically
- [ ] Dashboard shows review history with status
- [ ] Auth via Clerk, each user sees only their installs