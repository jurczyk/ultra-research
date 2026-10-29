import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { IngestedPaper } from "./types";

export function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Collapse duplicates within one batch (Postgres rejects same key twice in one upsert). */
export function dedupeBatch(papers: IngestedPaper[]): IngestedPaper[] {
  const map = new Map<string, IngestedPaper>();
  for (const p of papers) {
    const existing = map.get(p.dedupe_key);
    // Prefer the record with an abstract / more citations.
    if (
      !existing ||
      (!existing.abstract && p.abstract) ||
      p.citation_count > existing.citation_count
    ) {
      map.set(p.dedupe_key, p);
    }
  }
  return [...map.values()];
}

/**
 * Upsert ingested metadata. Only metadata columns are sent, so on conflict
 * existing summary/status/review fields are left untouched.
 * Returns number of rows written.
 */
export async function upsertPapers(
  db: SupabaseClient,
  papers: IngestedPaper[],
  chunkSize = 200,
): Promise<number> {
  const unique = dedupeBatch(papers);
  let written = 0;
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize);
    const { error, count } = await db
      .from("papers")
      .upsert(chunk, { onConflict: "dedupe_key", count: "exact" });
    if (error) throw new Error(`upsert failed: ${error.message}`);
    written += count ?? chunk.length;
  }
  return written;
}
