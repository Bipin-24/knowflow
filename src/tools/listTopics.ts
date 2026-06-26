// src/tools/listTopics.ts
import { corpus } from "../data/corpus.js";

export async function listTopics(args: Record<string, unknown>) {
  const product    = args.product    as string | undefined;
  const topic_type = args.topic_type as string | undefined;

  const filtered = corpus.filter((t) => {
    if (product    && product    !== "all" && t.product    !== product)    return false;
    if (topic_type && topic_type !== "all" && t.topic_type !== topic_type) return false;
    return true;
  });

  const grouped: Record<string, object[]> = {};
  for (const t of filtered) {
    if (!grouped[t.product]) grouped[t.product] = [];
    grouped[t.product].push({
      topic_id:   t.id,
      title:      t.title,
      version:    t.version,
      topic_type: t.topic_type,
      audience:   t.audience,
      tags:       t.tags,
      last_reviewed: t.last_reviewed,
    });
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({ total: filtered.length, topics_by_product: grouped }, null, 2),
    }],
  };
}
