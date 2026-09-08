# Booking Sanitizer

App to analyze and find anomalies in booking data. Uses AI for analysis, but focuses on analysis that can be safely derived from the data — without speculation.

## Main features

- **Booking Insights** — Insights that can be safely derived from the raw data
- **Duplicate booking detection** — Showing potential duplicates in bookings
- **Anomalies** — Help to find inconsistencies or errors on the data
- **Data sources** — An AI-based import for raw booking data

## Core thesis: relational document ingestor with LLM structured output

This architecture is one I came up with in the Prism project at Bitpanda, to ingest large amounts of financial PDFs for portfolio analysis. It works well for financial portfolio analysis — but it's unproven for accounting data. This demo app exists to explore whether it also works for accounting data.

Core pillars:

- **Single-pass ingestion** — Ingestion goes through an LLM structured prompt that guarantees a given JSON schema, which is then written into a relational DB schema.
- **Deterministic guardrails** — A few guardrails after ingestion reject documents that are entirely unusable, e.g. a booking without a date.
- **On-the-fly entity generation** — Needed DB entities are built up on the fly from the documents, without a predefined entity list.
- **Idempotent imports** — The DB schema hashes source documents to deduplicate them, making imports idempotent. Manual intervention can still delete an instance and repeat an import.
- **Post-import fixes via Data sources pages** — The architecture needs high accuracy from the single-pass ingestion; for the rare cases it falls short, Data sources pages list instances for manual correction, assisted by an anomaly-detection feature.
- **Traceability back to raw data** — Data sources pages let you review, for each instance, which raw data file it came from.

## Shortcuts taken

Due to tight time limits, a few shortcuts were taken that I would not take for a real MVP.

**Missing expert evaluation on input data** — Generated input data may be unrealistic. Although I studied accounting in my BSc, I don't actually know how such data looks in real companies.

**No authentication** — No user management, no separation between users, only one database for one user. No security checks yet. 

**Focus on the data model, not the code** — Focus was on a clean, persistent data model. Clean code and clean architecture on the TypeScript side were largely not prompted yet.

