# knowflow

> *Documentation has always been a knowledge layer. knowflow makes it one that AI can actually reach.*

**knowflow** is an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server built by an Information Architect who got tired of context-switching between four tools to answer one question: *what are users not finding?*

It connects your documentation corpus, GA4 search analytics, Jenkins CI pipeline, and a RAGAS-style evaluation layer to Claude — in a single conversation.

```
Claude Desktop / Claude Code
        │
        │  JSON-RPC over stdio
        ▼
   knowflow
        │
        ├── search_docs          → TF-IDF corpus search (upgradeable to pgvector / ChromaDB)
        ├── get_topic            → Full topic content by ID
        ├── list_topics          → Corpus index with product and type filters
        ├── get_content_gaps     → GA4 zero-result queries → ranked content gap list
        ├── get_build_status     → Jenkins publish pipeline status
        └── evaluate_pipeline    → RAGAS-style eval: relevance · faithfulness · recall
```

---

## Why we built this

Every documentation team asks the same question: *what should we write next?*

The answer used to live in three or four separate places — search analytics in GA4, existing content in a docs site, topic hierarchy in a spreadsheet, build status in Jenkins. Getting from "what are users not finding?" to "here is a drafted topic" used to take hours of context-switching.

knowflow collapses that into a single conversation.

```
get_content_gaps          "47 users searched for X and got nothing"
       ↓
search_docs               "nearest existing topic: rpm-upgrade-8.0"
       ↓
get_topic                 "here is the full content as context"
       ↓
Claude drafts             the missing section in under two minutes
       ↓
evaluate_pipeline         "faithfulness: 0.91 · relevance: 0.87 · recall: 0.74"
       ↓
IA reviews → publishes → gap closes → loop repeats
```

The part that changed most isn't the speed. It's the signal.
You now know what to write before a support ticket tells you.

---

## What you can ask Claude once connected

> *"What are the top ten search queries from the last 30 days that returned no results?"*

> *"Run evaluate_pipeline with report_format markdown — show me which queries are underperforming and why."*

> *"Find every topic in the corpus that mentions the Tableau connector. Did the docs build pass today?"*

> *"A user searched for 'silent RPM install' 47 times and got nothing. Find the nearest existing topic and draft the missing section."*

> *"Which topics haven't been reviewed in over 90 days? Flag them as potential faithfulness risks."*

---

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/Bipin-24/knowflow.git
cd knowflow
npm install
npm run build
```

### 2. Connect to Claude Desktop

Open your Claude Desktop config:

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

Add this block:

```json
{
  "mcpServers": {
    "knowflow": {
      "command": "node",
      "args": ["/absolute/path/to/knowflow/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. You should see `knowflow` in the tools list.

### 3. Connect to Claude Code

Drop a `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "knowflow": {
      "command": "node",
      "args": ["../knowflow/dist/index.js"]
    }
  }
}
```

---

## Tools

### `search_docs`
Semantic search across the documentation corpus.

```
query    string   required   Natural language search query
product  string   optional   analytics-engine | ingres | actian-client | all
version  string   optional   e.g. "8.0", "11.x"
limit    number   optional   1–10, default 5
```

### `get_topic`
Retrieve full Markdown content of a topic by ID.

```
topic_id  string  required  Topic ID from search_docs results
```

### `list_topics`
Browse the corpus index with optional filters.

```
product     string  optional  analytics-engine | ingres | actian-client | all
topic_type  string  optional  concept | task | reference | troubleshooting | all
```

### `get_content_gaps`
Surface search queries that returned zero or few results — content your users need but doesn't exist yet.

```
days          number  optional  Lookback window, default 30
limit         number  optional  Max gaps to return, default 20
min_searches  number  optional  Minimum search volume, default 2
```

Returns each gap with `gap_type` (missing\_content | low\_discoverability), nearest existing topic, search volume, and recommended action.

### `get_build_status`
Check Jenkins CI/CD publish pipeline status.

```
job  string  optional  Jenkins job name, default "actian-docs-publish"
```

### `evaluate_pipeline`
Run a RAGAS-style evaluation across the pipeline.

```
queries        string[]  optional  Test queries. Uses default set of 10 if omitted.
report_format  string    optional  summary | detailed | markdown  (default: summary)
```

| Metric | What it measures |
|--------|-----------------|
| Answer relevance | Does retrieved content answer the query? |
| Faithfulness | Are claims grounded in the source corpus? |
| Context recall | Did retrieval surface the most useful content? |

---

## Architecture

### Search
Ships with a lightweight TF-IDF engine — no external dependencies or API keys. To upgrade to embedding-based semantic search:

1. Add `chromadb` or `pgvector` to `package.json`
2. Run `scripts/index_corpus.py` to embed the corpus
3. Swap `scoreTopics()` in `src/lib/search.ts` for a vector similarity query

### Evaluation
`src/lib/evaluator.ts` uses deterministic heuristics as a RAGAS approximation — no LLM API calls required to run. Replace with the [RAGAS Python library](https://docs.ragas.io) for production use with an LLM judge.

### Live data
Ships with realistic mock data for GA4 and Jenkins. To connect live sources:

```bash
cp .env.example .env
# Fill in BIGQUERY_PROJECT_ID, JENKINS_URL, JENKINS_TOKEN
```

The BigQuery SQL for GA4 Site Search export is in `scripts/ga4_export.sql`.

---

## Project structure

```
knowflow/
├── src/
│   ├── index.ts                  # MCP server — tool registry and router
│   ├── tools/
│   │   ├── searchDocs.ts
│   │   ├── getTopic.ts
│   │   ├── listTopics.ts
│   │   ├── getContentGaps.ts
│   │   ├── getBuildStatus.ts
│   │   └── evaluatePipeline.ts   # RAGAS-style evaluation
│   ├── data/
│   │   └── corpus.ts             # Sample documentation topics
│   └── lib/
│       ├── search.ts             # TF-IDF search engine
│       └── evaluator.ts          # Evaluation engine
├── scripts/
│   └── ga4_export.sql            # BigQuery query for live GA4 export
├── .env.example
├── package.json
└── tsconfig.json
```

---

## Upgrading to live data

| What | Status | How to upgrade |
|------|--------|----------------|
| Search | TF-IDF (built-in) | Swap for ChromaDB / pgvector |
| Content gaps | Mock GA4 data | Wire in BigQuery — see `scripts/ga4_export.sql` |
| Build status | Mock Jenkins data | Add `JENKINS_URL` + `JENKINS_TOKEN` to `.env` |
| Evaluation | Deterministic heuristics | Replace with RAGAS Python library |

---

## Tech stack

- **Runtime:** Node.js 18+ / TypeScript
- **Protocol:** `@modelcontextprotocol/sdk`
- **Search:** TF-IDF → pgvector / ChromaDB
- **Evaluation:** Deterministic RAGAS approximation → RAGAS Python
- **Analytics:** Mock GA4 → BigQuery
- **CI:** Mock Jenkins → Jenkins REST API

---

## Related projects

- [`Documentation-AI-Assistant`](https://github.com/Bipin-24/Documentation-AI-Assistant) — RAG pipeline and chat UI over a documentation corpus
- [IA Playbook](https://information-architecture-playbook.vercel.app) — AI content governance framework for RAG-ready documentation

---

## Author

**Bipin Pandey** — Principal Information Architect  
Building the knowledge layer that humans and AI systems both depend on.

[Portfolio](https://bipin-24.github.io) · [LinkedIn](https://www.linkedin.com/in/bipin-pandey24/) · [GitHub](https://github.com/Bipin-24)
