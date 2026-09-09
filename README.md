# Booking Sanitizer

App to analyze and find anomalies in booking data. Uses AI for analysis, but focuses on analysis that can be safely derived from the data — without speculation.

## Main features

- **Booking Insights** — Insights that can be safely derived from the raw data
- **Duplicate booking detection** — Showing potential duplicates in bookings
- **Anomalies** — Help to find inconsistencies or errors on the data
- **Data sources** — An import for raw booking data

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

## Shortcuts taken

Due to tight time limits, a few shortcuts were taken that I would not take for a real MVP.

**Missing expert evaluation on input data** — Generated input data may be unrealistic. Although I studied accounting in my BSc, I don't actually know how such data looks in real companies.

**No authentication** — No user management, no separation between users, only one database for one user. No security checks yet. 

**Focus on the data model, not the code** — Focus was on a clean, persistent data model. Clean code and clean architecture on the TypeScript side were largely not prompted yet.

