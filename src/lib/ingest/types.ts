export interface IngestedPaper {
  doi: string | null;
  dedupe_key: string;
  title: string;
  authors: string[];
  journal: string | null;
  published_date: string | null; // YYYY-MM-DD
  abstract: string | null;
  url: string | null;
  source: "openalex" | "pubmed" | "europepmc";
  source_id: string;
  is_preprint: boolean;
  peer_reviewed: boolean;
  citation_count: number;
}
