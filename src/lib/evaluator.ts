/**
 * RAGAS-style evaluation engine
 *
 * Measures three core metrics against the docs corpus:
 *   - Answer relevance:  does the retrieved content answer the query?
 *   - Faithfulness:      are claims grounded in retrieved source?
 *   - Context recall:    did retrieval surface the most relevant content?
 *
 * This is a deterministic approximation of RAGAS — no LLM API calls required.
 * Replace with actual RAGAS library calls once live GA4 + embeddings are wired up.
 */

import { scoreTopics } from "./search.js";
import { corpus } from "../data/corpus.js";

export interface EvalResult {
  query: string;
  answer_relevance: number;   // 0–1
  faithfulness: number;        // 0–1
  context_recall: number;      // 0–1
  composite: number;           // weighted average
  retrieved_topics: string[];
  diagnosis: string;
}

export interface EvalReport {
  timestamp: string;
  query_count: number;
  mean_answer_relevance: number;
  mean_faithfulness: number;
  mean_context_recall: number;
  mean_composite: number;
  results: EvalResult[];
  low_performers: EvalResult[];
  recommendation: string;
}

// Default evaluation queries — real user questions from the mock GA4 dataset
const DEFAULT_QUERIES = [
  "How do I upgrade Analytics Engine using RPM packages?",
  "Silent install Analytics Engine 8.0",
  "Tableau connector not found after upgrade",
  "ODBC DSN connection string parameters",
  "ckpdb backup options for Ingres",
  "columnar query performance slow",
  "Actian Vector migration to Analytics Engine",
  "JDBC timeout settings",
  "rpm upgrade silent install",
  "structure key definition vectorwise",
];

function computeAnswerRelevance(query: string, retrievedIds: string[]): number {
  // Heuristic: fraction of query terms appearing in retrieved topic titles/tags
  const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 3);
  if (queryTerms.length === 0) return 0;

  const retrievedTopics = corpus.filter((t) => retrievedIds.includes(t.id));
  const topicText = retrievedTopics
    .flatMap((t) => [...t.tags, ...t.title.toLowerCase().split(" ")])
    .join(" ");

  const matched = queryTerms.filter((term) => topicText.includes(term)).length;
  return Math.min(1, matched / queryTerms.length + 0.1);
}

function computeFaithfulness(retrievedIds: string[]): number {
  // Heuristic: topics with recent review dates are more likely to be accurate
  const retrieved = corpus.filter((t) => retrievedIds.includes(t.id));
  if (retrieved.length === 0) return 0;

  const now = new Date("2025-06-01");
  const scores = retrieved.map((t) => {
    const reviewed = new Date(t.last_reviewed);
    const daysSince = (now.getTime() - reviewed.getTime()) / (1000 * 60 * 60 * 24);
    // Recent = high faithfulness score; > 365 days = drops off
    return Math.max(0, 1 - daysSince / 400);
  });

  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function computeContextRecall(query: string, retrievedIds: string[]): number {
  // Heuristic: did we retrieve anything? Did we retrieve a task type? (usually most useful)
  if (retrievedIds.length === 0) return 0;
  const retrieved = corpus.filter((t) => retrievedIds.includes(t.id));
  const hasTask = retrieved.some((t) => t.topic_type === "task");
  const hasTroubleshooting = retrieved.some((t) => t.topic_type === "troubleshooting");
  const isHowToQuery = /how|setup|configure|install|upgrade|create|fix/i.test(query);

  let score = 0.5; // baseline for retrieving anything
  if (isHowToQuery && hasTask) score += 0.3;
  if (hasTroubleshooting) score += 0.1;
  if (retrievedIds.length >= 3) score += 0.1;
  return Math.min(1, score);
}

function diagnose(result: Omit<EvalResult, "diagnosis">): string {
  if (result.retrieved_topics.length === 0) return "No results retrieved — content gap confirmed";
  if (result.answer_relevance < 0.4) return "Low answer relevance — chunking or metadata issue";
  if (result.faithfulness < 0.5) return "Low faithfulness — topic may be outdated; review last_reviewed date";
  if (result.context_recall < 0.6) return "Low context recall — missing task-type topic for this query";
  if (result.composite > 0.75) return "Good — no action needed";
  return "Acceptable — monitor for regression";
}

export function runEvaluation(queries?: string[]): EvalReport {
  const evalQueries = queries && queries.length > 0 ? queries : DEFAULT_QUERIES;

  const results: EvalResult[] = evalQueries.map((query) => {
    const retrieved = scoreTopics(query, undefined, undefined, 5);
    const retrievedIds = retrieved.map((r) => r.topic.id);

    const answer_relevance = computeAnswerRelevance(query, retrievedIds);
    const faithfulness = computeFaithfulness(retrievedIds);
    const context_recall = computeContextRecall(query, retrievedIds);
    const composite = answer_relevance * 0.4 + faithfulness * 0.35 + context_recall * 0.25;

    const partial = { query, answer_relevance, faithfulness, context_recall, composite, retrieved_topics: retrievedIds };
    return { ...partial, diagnosis: diagnose(partial) };
  });

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  const mean_answer_relevance = mean(results.map((r) => r.answer_relevance));
  const mean_faithfulness     = mean(results.map((r) => r.faithfulness));
  const mean_context_recall   = mean(results.map((r) => r.context_recall));
  const mean_composite        = mean(results.map((r) => r.composite));

  const low_performers = results.filter((r) => r.composite < 0.5);

  let recommendation = "Pipeline quality is acceptable.";
  if (mean_composite < 0.5) recommendation = "Pipeline needs attention — review chunking architecture and topic coverage.";
  else if (mean_faithfulness < 0.6) recommendation = "Several topics may be outdated — run a content freshness audit.";
  else if (low_performers.length > 2) recommendation = `${low_performers.length} queries are underperforming — consider adding missing topics for those gaps.`;

  return {
    timestamp: new Date().toISOString(),
    query_count: evalQueries.length,
    mean_answer_relevance: Math.round(mean_answer_relevance * 100) / 100,
    mean_faithfulness:     Math.round(mean_faithfulness * 100) / 100,
    mean_context_recall:   Math.round(mean_context_recall * 100) / 100,
    mean_composite:        Math.round(mean_composite * 100) / 100,
    results,
    low_performers,
    recommendation,
  };
}
