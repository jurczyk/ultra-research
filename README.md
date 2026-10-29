# Ultra Research

Ultramarathon research aggregator for ultramarathoning101.com.
Nightly ingest (OpenAlex, PubMed, Europe PMC) -> AI summaries -> human review -> published site + weekly Brevo digest.

## Start
1. `cd ultra-research && git init`
2. Create a GitHub repo and push.
3. Create a Supabase project; run `supabase/schema.sql`.
4. Copy `.env.example` to `.env.local` and fill in keys.
5. In Claude Code, run: "Read CLAUDE.md and docs/BUILD_PLAN.md, then start Week 1."
6. Import the repo in Vercel; add env vars and the cron jobs.

See `CLAUDE.md` for architecture and rules.
