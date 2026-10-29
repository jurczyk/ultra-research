import { NextResponse } from "next/server";
import { fetchOpenAlex } from "@/lib/ingest/openalex";
import { serviceClient, upsertPapers } from "@/lib/ingest/store";

export const maxDuration = 300;

/**
 * Nightly ingest. Auth: Authorization: Bearer $CRON_SECRET
 * Query: ?backfill=1 pulls everything; default pulls the last 14 days
 * (overlap is safe because upserts dedupe by key).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const backfill = new URL(req.url).searchParams.get("backfill") === "1";
  const since = backfill
    ? undefined
    : new Date(Date.now() - 14 * 86400_000).toISOString().slice(0, 10);

  const db = serviceClient();
  const { data: run } = await db
    .from("ingest_runs")
    .insert({ source: "openalex" })
    .select("id")
    .single();

  try {
    const papers = await fetchOpenAlex({ since, maxPages: backfill ? 50 : 10 });
    const written = await upsertPapers(db, papers);
    if (run) {
      await db
        .from("ingest_runs")
        .update({
          finished_at: new Date().toISOString(),
          fetched: papers.length,
          inserted: written,
        })
        .eq("id", run.id);
    }
    return NextResponse.json({ source: "openalex", fetched: papers.length, written });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    if (run) {
      await db
        .from("ingest_runs")
        .update({ finished_at: new Date().toISOString(), error: message })
        .eq("id", run.id);
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
