import { dedupeKey, normalizeDoi } from "./dedupe";
import type { IngestedPaper } from "./types";

const BASE = "https://api.openalex.org/works";

/** Ultra-focused search terms (OpenAlex search supports quoted phrases). */
export const ULTRA_QUERY =
  '"ultramarathon" OR "ultra-marathon" OR "ultra marathon" OR "ultra-endurance" OR "ultraendurance" OR "ultrarunning" OR "ultra-running" OR "ultrarunner" OR "mountain ultramarathon" OR "ultra-trail"';

interface OAWork {
  id: string;
  doi?: string | null;
  title?: string | null;
  display_name?: string | null;
  publication_date?: string | null;
  cited_by_count?: number;
  type?: string | null;
  authorships?: { author?: { display_name?: string } }[];
  primary_location?: {
    landing_page_url?: string | null;
    version?: string | null;
    source?: { display_name?: string; type?: string } | null;
  } | null;
  abstract_inverted_index?: Record<string, number[]> | null;
}

/** OpenAlex ships abstracts as an inverted index; rebuild plain text. */
export function rebuildAbstract(
  inv: Record<string, number[]> | null | undefined,
): string | null {
  if (!inv) return null;
  const words: string[] = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const p of positions) words[p] = word;
  }
  const text = words.filter(Boolean).join(" ").trim();
  return text || null;
}

export function mapWork(w: OAWork): IngestedPaper | null {
  const title = (w.title ?? w.display_name ?? "").trim();
  if (!title) return null;
  const doi = normalizeDoi(w.doi);
  const authors = (w.authorships ?? [])
    .map((a) => a.author?.display_name)
    .filter((n): n is string => !!n);
  const loc = w.primary_location;
  const isPreprint =
    w.type === "preprint" ||
    loc?.version === "submittedVersion" ||
    loc?.source?.type === "repository";
  return {
    doi,
    dedupe_key: dedupeKey(doi, title, authors[0]),
    title,
    authors,
    journal: loc?.source?.display_name ?? null,
    published_date: w.publication_date ?? null,
    abstract: rebuildAbstract(w.abstract_inverted_index),
    url: doi ? `https://doi.org/${doi}` : (loc?.landing_page_url ?? null),
    source: "openalex",
    source_id: w.id,
    is_preprint: isPreprint,
    peer_reviewed: !isPreprint,
    citation_count: w.cited_by_count ?? 0,
  };
}

export interface FetchOptions {
  /** ISO date (YYYY-MM-DD); only works published on/after. Omit for backfill. */
  since?: string;
  maxPages?: number;
  perPage?: number;
  mailto?: string;
  fetchImpl?: typeof fetch;
}

/** Fetch ultra-related works from OpenAlex using cursor paging. */
export async function fetchOpenAlex(
  opts: FetchOptions = {},
): Promise<IngestedPaper[]> {
  const {
    since,
    maxPages = 20,
    perPage = 100,
    mailto = process.env.OPENALEX_MAILTO,
    fetchImpl = fetch,
  } = opts;

  const filters = [`title_and_abstract.search:${ULTRA_QUERY}`, "type:article|preprint|review"];
  if (since) filters.push(`from_publication_date:${since}`);

  const out: IngestedPaper[] = [];
  let cursor = "*";
  for (let page = 0; page < maxPages && cursor; page++) {
    const url = new URL(BASE);
    url.searchParams.set("filter", filters.join(","));
    url.searchParams.set("per-page", String(perPage));
    url.searchParams.set("cursor", cursor);
    url.searchParams.set("sort", "publication_date:desc");
    if (mailto) url.searchParams.set("mailto", mailto);

    const res = await fetchImpl(url);
    if (!res.ok) {
      throw new Error(`OpenAlex ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as {
      results: OAWork[];
      meta: { next_cursor: string | null };
    };
    for (const w of json.results) {
      const p = mapWork(w);
      if (p) out.push(p);
    }
    cursor = json.meta.next_cursor ?? "";
    if (json.results.length === 0) break;
  }
  return out;
}
