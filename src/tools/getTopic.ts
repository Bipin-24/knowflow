// src/tools/getTopic.ts
import { topicIndex } from "../data/corpus.js";

export async function getTopic(args: Record<string, unknown>) {
  const topic_id = String(args.topic_id ?? "");
  const topic = topicIndex.get(topic_id);

  if (!topic) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ error: `Topic '${topic_id}' not found`, available_ids: [...topicIndex.keys()] }),
      }],
      isError: true,
    };
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        topic_id:     topic.id,
        title:        topic.title,
        product:      topic.product,
        version:      topic.version,
        topic_type:   topic.topic_type,
        audience:     topic.audience,
        tags:         topic.tags,
        last_reviewed: topic.last_reviewed,
        content:      topic.content,
        word_count:   topic.content.split(/\s+/).length,
      }, null, 2),
    }],
  };
}
