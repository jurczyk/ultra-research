-- Ultra Research schema
create extension if not exists pgcrypto;

create type paper_status as enum ('ingested', 'pending_review', 'published', 'rejected');

create table papers (
  id uuid primary key default gen_random_uuid(),
  doi text unique,                      -- normalized lowercase
  dedupe_key text unique not null,      -- doi or hash(title + first author)
  title text not null,
  authors text[] default '{}',
  journal text,
  published_date date,
  abstract text,
  url text,
  source text not null,                 -- openalex | pubmed | europepmc
  source_id text,
  is_preprint boolean default false,
  peer_reviewed boolean default true,
  published_version_doi text,           -- link preprint to final version
  citation_count int default 0,

  -- AI enrichment (human-reviewed before publish)
  summary text,
  takeaway text,
  topics text[] default '{}',
  evidence jsonb default '{}'::jsonb,   -- sample_size, population, design
  sensitive boolean default false,      -- hydration/sodium/nutrition flag

  slug text unique,
  status paper_status not null default 'ingested',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index papers_status_idx on papers (status);
create index papers_topics_idx on papers using gin (topics);
create index papers_date_idx on papers (published_date desc);
create index papers_fts_idx on papers using gin (
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(abstract,''))
);

create table topics (
  slug text primary key,
  name text not null,
  description text
);

insert into topics (slug, name) values
  ('fueling','Fueling'),('hydration','Hydration'),('heat','Heat'),('cold','Cold'),
  ('altitude','Altitude'),('injury','Injury'),('sleep','Sleep'),('pacing','Pacing'),
  ('recovery','Recovery'),('aging','Aging'),('women','Women'),('psychology','Psychology'),
  ('training','Training'),('gear','Gear'),('physiology','Physiology'),('health-risk','Health risk')
on conflict do nothing;

create table ingest_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  started_at timestamptz default now(),
  finished_at timestamptz,
  fetched int default 0,
  inserted int default 0,
  error text
);

-- Public read of published papers only
alter table papers enable row level security;
create policy "public read published" on papers
  for select using (status = 'published');
