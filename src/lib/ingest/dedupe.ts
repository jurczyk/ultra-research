import { createHash } from "node:crypto";

/** Normalize a DOI to lowercase bare form (no URL prefix). */
export function normalizeDoi(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const doi = raw
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .toLowerCase();
  return /^10\.\d{4,9}\/\S+$/.test(doi) ? doi : null;
}

function normalizeText(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Dedupe key: DOI when present, else hash of title + first author. */
export function dedupeKey(
  doi: string | null,
  title: string,
  firstAuthor: string | undefined,
): string {
  if (doi) return `doi:${doi}`;
  const h = createHash("sha256")
    .update(`${normalizeText(title)}|${normalizeText(firstAuthor ?? "")}`)
    .digest("hex")
    .slice(0, 32);
  return `hash:${h}`;
}
