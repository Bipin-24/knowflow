// src/tools/searchDocs.ts
import { scoreTopics } from "../lib/search.js";

export async function searchDocs(args: Record<string, unknown>) {
  const query   = String(args.query ?? "");
  const product = args.product as string | undefined;
  const version = args.version as string | undefined;
  const limit   = Number(args.limit ?? 5);

  const results = scoreTopics(query, product, version, limit);

  if (results.length === 0) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ query, total_results: 0, results: [], suggestion: "No matching topics found — this may be a content gap." }),
      }],
    };
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        query,
        total_results: results.length,
        results: results.map((r) => ({
          topic_id:      r.topic.id,
          title:         r.topic.title,
          product:       r.topic.product,
          version:       r.topic.version,
          topic_type:    r.topic.topic_type,
          tags:          r.topic.tags,
          relevance_score: Math.round(r.score * 1000) / 1000,
          excerpt:       r.excerpt,
        })),
      }, null, 2),
    }],
  };
}
