# Contributing to knowflow

Thank you for your interest in knowflow.

## Ways to contribute

- **Add corpus topics** — extend `src/data/corpus.ts` with more documentation topics
- **Wire in live data** — connect real GA4 and Jenkins sources via `.env`
- **Upgrade search** — swap TF-IDF for ChromaDB or pgvector
- **Improve evaluation** — replace deterministic heuristics with RAGAS Python

## Setup

```bash
git clone https://github.com/Bipin-24/knowflow.git
cd knowflow
npm install
npm run build
```

## Pull request guidelines

- Keep PRs focused — one change per PR
- Add a clear description of what changed and why
- TypeScript strict mode must pass: `npm run build`

## Author

Bipin Pandey — [bipin-24.github.io](https://bipin-24.github.io)
