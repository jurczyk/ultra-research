# Build Plan (about 4 weeks)

## Week 1: Data pipeline
- [ ] `npx create-next-app` (TS, Tailwind, App Router)
- [ ] Apply `supabase/schema.sql`
- [ ] OpenAlex ingest module (keywords, date filter, pagination)
- [ ] PubMed ingest module
- [ ] Europe PMC preprint ingest module
- [ ] DOI dedupe + upsert
- [ ] `/api/cron/ingest` + Vercel cron config

## Week 2: Enrichment + review
- [ ] Claude enrichment with JSON schema validation (zod)
- [ ] `/api/cron/enrich`
- [ ] `/admin/review` queue (Supabase Auth, single admin)
- [ ] Approve / edit / reject / flag-sensitive actions

## Week 3: Public site + backfill
- [ ] Home, papers list/search/filters, paper detail, topic pages
- [ ] SEO: metadata, sitemap, JSON-LD ScholarlyArticle
- [ ] Backfill about 200 key papers (major reviews, Western States research)
- [ ] Methodology + disclaimer pages

## Week 4: Newsletter + launch
- [ ] Brevo signup form + list
- [ ] Weekly digest generator (top 3-5 published papers)
- [ ] Connect ultramarathoning101.com domain on Vercel
- [ ] Soft launch to running network and Facebook groups

## 90-day success test
300+ newsletter signups and growing organic traffic on topic pages. Then add sponsors, affiliates, premium alerts.
