# Booking Sanitizer

App to analyze and find anomalies in booking data. Uses AI for analysis, but focuses on analysis that can be safely derived from the data — without speculation.

## Main features

- **Booking Insights** — Insights that can be safely derived from the raw data
- **Duplicate booking detection** — Showing potential duplicates in bookings
- **Anomalies** — Help to find inconsistencies or errors on the data
- **Data sources** — An import for raw booking data

## How to run

```
cp apps/backend/.env.example apps/backend/.env
pnpm install
pnpm db:up          # Postgres via Docker Compose
pnpm prisma:migrate
pnpm backend:dev    # http://localhost:3001
pnpm frontend:dev   # http://localhost:3000
```

Then open the Data sources page and click "Import sample data".

## Core thesis: relational document ingestor

A "relational document ingestor" is an architecture that I came up with in the Prism project at Bitpanda, to ingest large amounts of financial PDFs for portfolio analysis. It works well for financial portfolio analysis — but it is yet unproven for accounting data.

Core pillars of the architecture:

- **Relational DB** — Unstructured or semi-structured data gets mapped into a predefined PostgreSQL DB schema.
- **On-the-fly entity generation** — Needed DB entities (accounts, cost centers, vendors, ...) are upserted on the fly from the documents, without a predefined entity list.
- **Post-import fixes via Data sources pages** — Data sources pages let you manually correct instances, assisted by an anomaly-detection feature.
- **Traceability back to raw data** — Data sources pages let you review, for each instance, which source document within the import it came from.
- **Idempotent imports** — The DB schema hashes source documents to deduplicate them, making imports idempotent. Manual intervention can still delete an instance and repeat an import.

## Assumption about import

I use a pre-generated deterministic import script for this demo's known input structure (CSV/JSON).
A real product facing arbitrary customer export formats might need LLM-based imports with structured outputs enforced by the LLM-sequencer, or it might need on-the-fly generated, sandboxed import scripts per format — out of scope for this demo.

## Context Engineering

Within this demo app, I explored the relational document ingestor thesis. While I can confidently say that this architecture works excellent for portfolio analysis of stocks, ETFs, crypto and other financial assets, it is still an unproven architecture for accounting data. So open question for me: Is this architecture flexible enough for the data that might be faced in real world accounting? Difficult to judge based on this generated demo data.

But for the sake of this demo, let's assume the answer is yes, and let us look at possible context fetching strategies for this approach:

**Ad Hoc Exploration of relational database** — The philosophy behind such queries is to gain evidence directly from the underlying database, without using a vector DB as an intermediate representation.

**MCP server on top of the relational data** — Based on the relational data representation, a natural expansion may be to build an MCP server on top of it. Why? Because an MCP (or a CLI tool) can use deterministic aggregations and provide them to an LLM in a condensed way.

**Risk: introduction of errors during import, drift between raw data (CSV, JSON) and relational data** — Given tools like anomaly detection, it should be possible to detect such import errors efficiently. However, the main value of this app should be to detect anomalies in the **user's data**, not anomalies of the import process of the tool itself. So one of the critical points, in my opinion, is to reduce the ratio of import errors to an absolute minimum, such that the main power of the anomaly detection is spent on helping the user with their job instead of debugging this tool.

## Shortcuts taken

Due to tight time limits, a few shortcuts were taken that I would not take for a real MVP.

**Missing expert evaluation on input data** — Generated input data may be unrealistic. Although I studied accounting in my BSc, I don't actually know how such data looks in real companies.

**No authentication** — No user management, no separation between users, only one database for one user. No security checks yet. 

**Focus on the data model, not the code** — Focus was on sensible dependencies and on probing the relational data model thesis. Clean code and clean architecture on the TypeScript side were largely not prompted yet.

**Rule suggestions are hardcoded, not AI-generated** — A real MVP might derive the booking manual live, e.g. with an LLM pass over current data. Here it's a fixed set mined once from the sample data, hardcoded into the demo page, due to time limits.

