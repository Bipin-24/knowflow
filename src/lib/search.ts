/**
 * TF-IDF search engine
 * Lightweight keyword search — no external dependencies.
 * Swap scoreTopics() for a ChromaDB or pgvector query to upgrade to semantic search.
 */

import { corpus, DocTopic } from "../data/corpus.js";

export interface SearchResult {
  topic: DocTopic;
  score: number;
  excerpt: string;
}

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function excerpt(content: string, query: string, maxLen = 200): string {
  const lower = content.toLowerCase();
  const terms = tokenise(query);
  let best = 0;
  for (const term of terms) {
    const idx = lower.indexOf(term);
    if (idx > best) best = idx;
  }
  const start = Math.max(0, best - 60);
  const raw = content.slice(start, start + maxLen).replace(/#+\s/g, "").trim();
  return (start > 0 ? "..." : "") + raw + (raw.length === maxLen ? "..." : "");
}

export function scoreTopics(
  query: string,
  product?: string,
  version?: string,
  limit = 5
): SearchResult[] {
  const terms = tokenise(query);

  const results: SearchResult[] = corpus
    .filter((t) => {
      if (product && product !== "all" && t.product !== product) return false;
      if (version && t.version !== version) return false;
      return true;
    })
    .map((topic) => {
      const haystack = [
        topic.title.repeat(3),       // title weight ×3
        topic.tags.join(" ").repeat(2), // tag weight ×2
        topic.content,
      ]
        .join(" ")
        .toLowerCase();

      let score = 0;
      for (const term of terms) {
        const matches = (haystack.match(new RegExp(term, "g")) || []).length;
        score += matches * (1 / Math.log(haystack.length + 1));
      }

      return { topic, score, excerpt: excerpt(topic.content, query) };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return results;
}
