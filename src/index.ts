#!/usr/bin/env node
/**
 * knowflow — MCP server that makes documentation natively queryable by AI
 *
 * Documentation has always been a knowledge layer.
 * knowflow makes it one that AI can actually reach.
 *
 * Exposes: search_docs, get_topic, list_topics, get_content_gaps,
 *          get_build_status, evaluate_pipeline
 *
 * Author: Bipin Pandey — Principal Information Architect
 * https://bipin-24.github.io · github.com/Bipin-24
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { searchDocs } from "./tools/searchDocs.js";
import { getTopic } from "./tools/getTopic.js";
import { listTopics } from "./tools/listTopics.js";
import { getContentGaps } from "./tools/getContentGaps.js";
import { getBuildStatus } from "./tools/getBuildStatus.js";
import { evaluatePipeline } from "./tools/evaluatePipeline.js";

const server = new Server(
  { name: "knowflow", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ── Tool registry ────────────────────────────────────────────────────────────
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_docs",
      description:
        "Semantic search across the documentation corpus. Returns ranked topics with relevance scores and excerpts.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Natural language search query" },
          product: {
            type: "string",
            enum: ["analytics-engine", "ingres", "actian-client", "all"],
            description: "Filter by product",
          },
          version: { type: "string", description: "Filter by version e.g. '8.0'" },
          limit: { type: "number", description: "Max results (1–10)", minimum: 1, maximum: 10 },
        },
        required: ["query"],
      },
    },
    {
      name: "get_topic",
      description: "Retrieve full Markdown content of a topic by ID.",
      inputSchema: {
        type: "object",
        properties: {
          topic_id: { type: "string", description: "Topic ID from search_docs results" },
        },
        required: ["topic_id"],
      },
    },
    {
      name: "list_topics",
      description: "Browse the full corpus index with optional filters.",
      inputSchema: {
        type: "object",
        properties: {
          product: {
            type: "string",
            enum: ["analytics-engine", "ingres", "actian-client", "all"],
          },
          topic_type: {
            type: "string",
            enum: ["concept", "task", "reference", "troubleshooting", "all"],
          },
        },
      },
    },
    {
      name: "get_content_gaps",
      description:
        "Surface search queries that returned zero or low results — documentation your users need but doesn't exist yet.",
      inputSchema: {
        type: "object",
        properties: {
          days: { type: "number", description: "Lookback window in days", default: 30 },
          limit: { type: "number", description: "Max gaps to return", default: 20 },
          min_searches: { type: "number", description: "Minimum search volume", default: 2 },
        },
      },
    },
    {
      name: "get_build_status",
      description: "Check Jenkins CI/CD publish pipeline status.",
      inputSchema: {
        type: "object",
        properties: {
          job: { type: "string", description: "Jenkins job name", default: "actian-docs-publish" },
        },
      },
    },
    {
      name: "evaluate_pipeline",
      description:
        "Run RAGAS-style evaluation on the RAG pipeline. Measures answer relevance, faithfulness, and context recall across a test query set.",
      inputSchema: {
        type: "object",
        properties: {
          queries: {
            type: "array",
            items: { type: "string" },
            description: "Test queries to evaluate. Uses default set if not provided.",
          },
          report_format: {
            type: "string",
            enum: ["summary", "detailed", "markdown"],
            default: "summary",
          },
        },
      },
    },
  ],
}));

// ── Tool router ───────────────────────────────────────────────────────────────
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const a = args ?? {};
    switch (name) {
      case "search_docs":       return await searchDocs(a);
      case "get_topic":         return await getTopic(a);
      case "list_topics":       return await listTopics(a);
      case "get_content_gaps":  return await getContentGaps(a);
      case "get_build_status":  return await getBuildStatus(a);
      case "evaluate_pipeline": return await evaluatePipeline(a);
      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { content: [{ type: "text", text: `Error: ${message}` }], isError: true };
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("knowflow v1.0.0 running on stdio");
