# PRAGATI AI: Project Handoff & Knowledge Base

> **Project Mission**: To modernize Maharashtra's Taluka Agriculture Offices through AI-powered automation, predictive distress scoring, and automated fraud detection.

---

## 🚀 1. Project Overview
PRAGATI (Progress) is an AI-first government platform designed to bridge the gap between complex agricultural administrative tasks and efficient public service. It handles document classification, scheme eligibility matching, grievance analysis with predictive distress scoring, and legal document auditing (VakilSaathi).

### Key Pillars:
1. **Intelligent Ingestion**: OCR-powered document classification and field extraction.
2. **Accountability**: Every action (rejection, approval, status change) is fire-and-forget logged in a tamper-evident audit trail.
3. **Predictive Welfare**: Real-time distress scoring based on application history and grievance urgency.
4. **Fraud Prevention**: Parallel deterministic checks to flag irregularities (duplicate Aadhaar, village clusters, land survey overlap).
5. **VakilSaathi**: A legal AI assistant to explain complex land/agreement documents to farmers and flag harmful clauses.

---

## 🛠 2. Technology Stack
* **Framework**: Next.js 15.1.4 (App Router)
* **Language**: TypeScript (Strict Mode)
* **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
* **Auth**: Supabase SSR (Cookie-based sessions)
* **AI Engine**: 
    * **Claude 3.5 Sonnet**: Used for complex extraction and structured JSON output (Document classification, Grievance priority, Legal analysis).
    * **Gemini 1.5 Flash**: Alternative engine for rapid processing.
* **OCR**: `pdf-parse` (v2) for digital PDFs, falling back to `Tesseract.js` for images/scans.
* **Styling**: Vanilla CSS (Premium aesthetics planned for Phase 2).

---

## 📂 3. Directory Structure
```text
PRAGATI/
├── app/
│   ├── api/                # 15+ REST endpoints for logic execution
│   │   ├── applications/   # CRUD, batch actions, detail view
│   │   ├── audit/          # Accountability logs retrieval
│   │   ├── classify-document/ # OCR + Fraud + Pre-rejection
│   │   ├── distress/       # Predictive risk scoring
│   │   └── legal-analysis/ # VakilSaathi logic
│   ├── login/              # Auth pages & server actions
│   ├── clerk/              # [PENDING] Clerk dashboard UI
│   └── officer/            # [PENDING] Officer dashboard UI
├── lib/
│   ├── audit.ts            # Audit log constructor & fire-and-forget logger
│   ├── claude.ts           # Anthropic wrapper with retry logic & prompts
│   ├── distress.ts         # Predictive scoring math (weighted signals)
│   ├── fraud.ts            # Parallel irregularity detection checks
│   ├── ocr.ts              # PDF/Image processing pipeline
│   ├── schemes.ts          # Rule-based eligibility matching for 10 schemes
│   └── supabase/           # SSR clients (client.ts, server.ts, middleware.ts)
├── types/
│   └── index.ts            # Centralized TypeScript interfaces
├── supabase/
│   └── schema.sql          # DB structure, RLS, triggers, indexes
├── scripts/
│   └── seed.js             # Realistic demo data generator
└── PROGRESS.md             # Living document of task completion
```

---

## 🧠 4. Intelligence Engines (The "Secret Sauce")

### A. The Fraud Engine (`lib/fraud.ts`)
Runs 5 checks in parallel to flag `risk_score` (LOW/MEDIUM/HIGH):
1. **Duplicate Aadhaar**: Flags if the last 4 digits are already registered in the district with a different name.
2. **Amount Anomaly**: Flags if a claim is >2.5x district average or 4x median for that document type.
3. **Village Cluster**: Flags if >10 applications arrive from the same village in 24 hours (detects intermediary interference).
4. **Land Survey Check**: Uses Regex to find "Gat No/Survey No" and cross-references existing non-rejected apps.
5. **Same-Scheme Check**: Prevents a farmer from having two active applications for the same scheme.

### B. Predictive Distress Scoring (`lib/distress.ts`)
Computes a `risk_level` (LOW/MEDIUM/HIGH/CRITICAL) for each farmer:
* **+20 pts**: Per rejection in the last 90 days.
* **+25 pts**: Per unresolved grievance past SLA deadline.
* **+40 pts**: Per Priority 5 (Critical) unresolved grievance.
* **+15 pts**: If eligible for 3+ schemes but applied for none (unclaimed benefits).
* **+30 pts**: Per insurance claim stuck for >30 days.

### C. VakilSaathi Legal AI (`lib/claude.ts` -> `LEGAL_PROMPT`)
* Analyzes documents like Land Sale Deeds or Tenancy Agreements.
* Flags "Harmful" clauses (e.g., hidden underpayment, missing witnesses).
* Explains clauses in "Plain English" for the farmer.

---

## 🗄 5. Database Schema Details
Full schema is in `supabase/schema.sql`. Key highlights:
* **Profiles**: Role-based (`clerk` vs `officer`).
* **Applications**: Central store for document data, risk scores, and irregularity flags.
* **Grievances**: Includes `sla_deadline` (auto-computed) and `priority` (AI-assigned).
* **Audit Log**: Every status change or application creation logs `actor_id`, `action`, and `details`.
* **RLS**: 
    * Everyone can read everything (authenticated).
    * Only Officers can `UPDATE` applications/grievances.
    * Only Service Role (API) can modify `distress_scores`.

---

## 🛣 6. Roadmap: Next Steps for the Next AI
You are currently entering **Phase 2: Frontend Implementation**.

### Immediate UI Tasks:
1. **Clerk Dashboard (`app/clerk/page.tsx`)**:
    * Document upload widget (use `react-dropzone`).
    * Display `POST /api/classify-document` results immediately.
    * Highlight `irregularity_flags` in red.
2. **Officer Dashboard (`app/officer/page.tsx`)**:
    * 9 KPI cards (Pending, Approved, High Risk, Critical Distress, etc.).
    * Queue table with sortable columns.
    * "Batch Approval" mode (select multiple rows -> call `/api/applications/batch`).
3. **Shared Components**:
    * `RiskBadge`: Colored tag for Risk Level.
    * `DistressPulse`: Pulsing red dot for Farmers in CRITICAL/HIGH distress.
    * `AuditTimeline`: Component to show the accountability trail for a single ID.

---

## 🔑 7. Demo & Development
### Credentials (populate with `node scripts/seed.js`):
* **Clerk**: `clerk@pragati.demo` / `clerk123`
* **Officer**: `officer@pragati.demo` / `officer123`

### Required Environment Variables (`.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
```

---

## 📜 8. Accountability Clause
Every API route should use the `logAudit` helper from `lib/audit.ts`.
Example:
```typescript
await logAudit(supabase, actorId, 'application_created', 'application', appId, { riskScore });
```
This is a core criterion for the project's success.

---
**Document Status**: Final Version (Phase 1 Complete)
**Created By**: Antigravity AI
**Date**: 2026-04-30
