// src/tools/getContentGaps.ts
import { scoreTopics } from "../lib/search.js";

// Mock GA4 search data — replace with BigQuery query in production
const mockSearchData = [
  { query: "rpm upgrade analytics engine 8.0 silent install",   searches: 47, product: "analytics-engine" },
  { query: "spark connector 3.5 compatibility",                  searches: 38, product: "analytics-engine" },
  { query: "tableau connector not found after upgrade",          searches: 43, product: "analytics-engine" },
  { query: "actian vector to analytics engine migration guide",  searches: 34, product: "analytics-engine" },
  { query: "ingres connection pool configuration",               searches: 29, product: "ingres" },
  { query: "jdbc timeout settings 8.0",                          searches: 26, product: "analytics-engine" },
  { query: "odbc dsn connection string parameters",              searches: 35, product: "actian-client" },
  { query: "analytics engine docker container setup",            searches: 24, product: "analytics-engine" },
  { query: "kubernetes deployment actian",                       searches: 21, product: null },
  { query: "ingres high availability failover",                  searches: 19, product: "ingres" },
  { query: "ckpdb backup options",                               searches: 28, product: "ingres" },
  { query: "column store performance slow query",                searches: 22, product: "analytics-engine" },
  { query: "rest api analytics engine",                          searches: 18, product: "analytics-engine" },
  { query: "windows server 2022 actian client install",          searches: 17, product: "actian-client" },
  { query: "analytics engine 8.0 release notes",                searches: 19, product: "analytics-engine" },
  { query: "ingres 11 ssl tls configuration",                    searches: 16, product: "ingres" },
  { query: "user authentication ldap actian",                    searches: 14, product: null },
  { query: "actian client linux silent install",                 searches: 13, product: "actian-client" },
  { query: "vectorwise structure key definition",                searches: 12, product: "analytics-engine" },
  { query: "python pyodbc actian connection example",            searches: 11, product: "actian-client" },
];

export async function getContentGaps(args: Record<string, unknown>) {
  const days         = Number(args.days ?? 30);
  const limit        = Number(args.limit ?? 20);
  const min_searches = Number(args.min_searches ?? 2);

  const eligible = mockSearchData.filter((d) => d.searches >= min_searches).slice(0, limit);

  const gaps = eligible.map((d) => {
    const results = scoreTopics(d.query, d.product ?? undefined, undefined, 1);
    const nearest = results[0];
    const gap_type = nearest && nearest.score > 0.01 ? "low_discoverability" : "missing_content";

    return {
      query:           d.query,
      searches:        d.searches,
      product:         d.product ?? "unknown",
      gap_type,
      nearest_topic_id:    nearest?.topic.id ?? null,
      nearest_topic_title: nearest?.topic.title ?? null,
      nearest_relevance:   nearest ? Math.round(nearest.score * 1000) / 1000 : 0,
      action: gap_type === "missing_content"
        ? "Create new topic"
        : "Improve metadata, tags, or heading structure for discoverability",
    };
  });

  const missing        = gaps.filter((g) => g.gap_type === "missing_content");
  const low_discov     = gaps.filter((g) => g.gap_type === "low_discoverability");
  const total_searches = gaps.reduce((acc, g) => acc + g.searches, 0);

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        data_source:    "mock",
        note:           "Replace with live BigQuery query — see scripts/ga4_export.sql",
        lookback_days:  days,
        total_gaps:     gaps.length,
        missing_content:        missing.length,
        low_discoverability:    low_discov.length,
        total_frustrated_searches: total_searches,
        gaps,
      }, null, 2),
    }],
  };
}
