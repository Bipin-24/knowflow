// src/tools/evaluatePipeline.ts
import { runEvaluation } from "../lib/evaluator.js";

export async function evaluatePipeline(args: Record<string, unknown>) {
  const queries       = args.queries as string[] | undefined;
  const report_format = String(args.report_format ?? "summary");

  const report = runEvaluation(queries);

  if (report_format === "markdown") {
    const rows = report.results
      .map(
        (r) =>
          `| ${r.query.slice(0, 45).padEnd(45)} | ${r.answer_relevance.toFixed(2)} | ${r.faithfulness.toFixed(2)} | ${r.context_recall.toFixed(2)} | ${r.composite.toFixed(2)} | ${r.diagnosis} |`
      )
      .join("\n");

    const md = `# RAGAS-style Pipeline Evaluation Report

**Run at:** ${report.timestamp}  
**Queries evaluated:** ${report.query_count}

## Summary scores

| Metric | Score |
|--------|-------|
| Mean answer relevance | ${report.mean_answer_relevance} |
| Mean faithfulness | ${report.mean_faithfulness} |
| Mean context recall | ${report.mean_context_recall} |
| **Mean composite** | **${report.mean_composite}** |

## Recommendation

${report.recommendation}

## Per-query results

| Query | Relevance | Faithful | Recall | Composite | Diagnosis |
|-------|-----------|----------|--------|-----------|-----------|
${rows}

## Low performers (composite < 0.50)

${
  report.low_performers.length === 0
    ? "_None — all queries above threshold._"
    : report.low_performers
        .map((r) => `- **${r.query}** — ${r.diagnosis}`)
        .join("\n")
}
`;

    return { content: [{ type: "text", text: md }] };
  }

  if (report_format === "detailed") {
    return { content: [{ type: "text", text: JSON.stringify(report, null, 2) }] };
  }

  // summary (default)
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        timestamp:              report.timestamp,
        query_count:            report.query_count,
        mean_answer_relevance:  report.mean_answer_relevance,
        mean_faithfulness:      report.mean_faithfulness,
        mean_context_recall:    report.mean_context_recall,
        mean_composite:         report.mean_composite,
        low_performer_count:    report.low_performers.length,
        low_performers:         report.low_performers.map((r) => ({ query: r.query, composite: r.composite, diagnosis: r.diagnosis })),
        recommendation:         report.recommendation,
      }, null, 2),
    }],
  };
}
