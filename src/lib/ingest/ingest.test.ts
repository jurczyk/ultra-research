import { describe, expect, it } from "vitest";
import { dedupeKey, normalizeDoi } from "./dedupe";
import { fetchOpenAlex, mapWork, rebuildAbstract } from "./openalex";
import { dedupeBatch } from "./store";

describe("normalizeDoi", () => {
  it("strips URL prefix and lowercases", () => {
    expect(normalizeDoi("https://doi.org/10.1007/S40279-021-01561-3")).toBe(
      "10.1007/s40279-021-01561-3",
    );
    expect(normalizeDoi("doi:10.3389/FPHYS.2018.00634")).toBe("10.3389/fphys.2018.00634");
  });
  it("rejects junk", () => {
    expect(normalizeDoi("not a doi")).toBeNull();
    expect(normalizeDoi(null)).toBeNull();
  });
});

describe("dedupeKey", () => {
  it("uses DOI when present", () => {
    expect(dedupeKey("10.1/x", "T", "A")).toBe("doi:10.1/x");
  });
  it("hash ignores case, punctuation, accents", () => {
    const a = dedupeKey(null, "Ultra-Marathon: Fatigue!", "Müller");
    const b = dedupeKey(null, "ultra marathon fatigue", "muller");
    expect(a).toBe(b);
  });
});

describe("rebuildAbstract", () => {
  it("orders words by position", () => {
    expect(rebuildAbstract({ world: [1], hello: [0, 2] })).toBe("hello world hello");
  });
  it("returns null for empty", () => {
    expect(rebuildAbstract(null)).toBeNull();
  });
});

describe("mapWork", () => {
  it("maps preprints and DOIs", () => {
    const p = mapWork({
      id: "https://openalex.org/W1",
      doi: "https://doi.org/10.1101/2024.01.01.123",
      title: "Ultra study",
      type: "preprint",
      authorships: [{ author: { display_name: "A One" } }],
      cited_by_count: 3,
    });
    expect(p?.is_preprint).toBe(true);
    expect(p?.peer_reviewed).toBe(false);
    expect(p?.dedupe_key).toBe("doi:10.1101/2024.01.01.123");
  });
  it("skips untitled works", () => {
    expect(mapWork({ id: "x" })).toBeNull();
  });
});

describe("dedupeBatch", () => {
  it("keeps one record per key, preferring abstract", () => {
    const base = mapWork({ id: "1", doi: "10.1/a", title: "T" })!;
    const withAbs = { ...base, abstract: "text" };
    expect(dedupeBatch([base, withAbs])).toHaveLength(1);
    expect(dedupeBatch([base, withAbs])[0].abstract).toBe("text");
  });
});

describe("fetchOpenAlex paging", () => {
  it("follows cursors and stops", async () => {
    const pages = [
      { results: [{ id: "1", title: "A", doi: "10.1/a" }], meta: { next_cursor: "c2" } },
      { results: [{ id: "2", title: "B", doi: "10.1/b" }], meta: { next_cursor: null } },
    ];
    let i = 0;
    const fake = (async () =>
      new Response(JSON.stringify(pages[i++]), { status: 200 })) as unknown as typeof fetch;
    const out = await fetchOpenAlex({ fetchImpl: fake });
    expect(out.map((p) => p.title)).toEqual(["A", "B"]);
  });
});
