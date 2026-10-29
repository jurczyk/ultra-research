# Ultra Research (ultramarathoning101.com)

Vertical aggregator of ultramarathon research. Pulls papers nightly, enriches with AI summaries, human-reviews, publishes.

## Stack
- Next.js (App Router, TypeScript, Tailwind) on Vercel
- Supabase (Postgres + Auth) for papers, topics, review queue
- Anthropic API for summaries and tagging
- Brevo for newsletter signups and weekly digest
- GitHub for source; Vercel Cron for nightly jobs

## Scope
Ultra-focused: ultramarathon, ultra-endurance, ultrarunning, mountain ultra. Roughly a few hundred papers per year. Exclude generic marathon/trail unless they also match ultra terms.

## Data sources (free APIs)
- OpenAlex (backbone, DOI metadata, citations)
- PubMed E-utilities (peer-reviewed biomedical)
- Europe PMC (preprints: bioRxiv, medRxiv, Research Square, SSRN)
- Dedupe by DOI (normalize lowercase); fallback to title+first author hash.

## Pipeline
1. `/api/cron/ingest` nightly: query sources, upsert into `papers` (status `ingested`).
2. `/api/cron/enrich` after ingest: for each `ingested` paper, call Claude to produce summary, takeaway, topics, evidence flags. Set status `pending_review`.
3. `/admin/review`: human approves/edits/rejects. Approved -> `published`. Nothing auto-publishes.
4. Public site renders only `published`.

## AI enrichment output (JSON)
- `summary`: 3 plain-English sentences
- `takeaway`: "So what for your next 100", 1-2 sentences, no medical directives
- `topics`: subset of fueling, hydration, heat, cold, altitude, injury, sleep, pacing, recovery, aging, women, psychology, training, gear, physiology, health-risk
- `evidence`: sample_size, population (elite|recreational|mixed|unknown), design, is_preprint, peer_reviewed
- Never invent numbers. If abstract lacks a field, return null.

## Safety rules
- Every public page shows "Not medical advice."
- Hydration, sodium, and nutrition claims must be human-reviewed before publishing.
- Always link to the original paper and DOI. Never reproduce full abstracts verbatim; summarize.
- Preprints are labeled clearly.

## Public pages
- `/` new this week + newsletter signup
- `/papers` search + filters (topic, evidence, preprint/peer-reviewed, year)
- `/papers/[slug]` paper detail
- `/topics/[topic]` SEO topic pages
- `/about`, `/methodology`

## Conventions
- TypeScript strict, server components by default.
- Secrets only in env vars (see `.env.example`). Never commit keys.
- Cron routes require `Authorization: Bearer $CRON_SECRET`.
- Write tests for dedupe and enrichment-JSON validation.

## Build order
See `docs/BUILD_PLAN.md`.
