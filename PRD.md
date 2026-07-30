# PRD: Unified Project Knowledge Repository

## 1. Summary
Teams' project knowledge is scattered across GitHub (code, issues, PRs), Zulip (discussions/decisions), Figma (design artifacts/comments), Notion (docs/specs), and similar tools. Nobody can search across all of them at once, context gets lost between platforms, and onboarding or "why did we do X" questions require manually digging through 4+ tools. This project builds a system that ingests data and conversations from these platforms into a unified, searchable, continuously-updated knowledge base.

## 2. Problem Statement
- Knowledge is fragmented across tools with no shared search or cross-linking.
- Decisions made in Zulip threads are disconnected from the GitHub PR or Notion doc they relate to.
- Design context in Figma (comments, version history) is invisible to engineers working in code.
- No single place to ask "what do we know about X" and get an answer grounded in real project history.
- Institutional knowledge walks out the door when people leave or forget.

## 3. Goals
- Connect to and ingest data from GitHub, Zulip, Figma, and Notion (extensible to more sources later).
- Normalize heterogeneous content (issues, PRs, commits, messages, threads, docs, design comments) into a common schema.
- Keep the knowledge base reasonably fresh via incremental sync, not just one-time import.
- Make the corpus searchable/queryable, including cross-source queries (e.g., "show everything related to the checkout redesign").
- Preserve provenance: every fact/answer traceable back to its source (platform, link, author, timestamp).
- Support Q&A / retrieval (e.g., via an LLM-backed interface) grounded in the ingested corpus.

## 4. Non-Goals (v1)
- Not building a replacement UI for any source platform (no editing GitHub issues, Zulip messages, etc. from this tool).
- Not real-time (sub-second) sync — near-real-time / periodic sync is acceptable.
- Not attempting to ingest every possible platform on day one — start with the 4 named sources, design for extensibility.
- Not solving fine-grained per-user permission mirroring in v1 (see Open Questions) — initial version assumes a single trusted internal audience unless stated otherwise.

## 5. Target Users
- Engineers/PMs/designers on the project who need cross-platform context.
- New team members onboarding and needing project history.
- Anyone asking "why"/"what"/"who decided" questions that span tools.

## 6. Data Sources & Scope (v1)

| Source | Content to ingest | Access method |
|---|---|---|
| GitHub | Repos, commits, PRs (+ review comments), issues (+ comments), releases, wiki (optional) | GitHub REST/GraphQL API + webhooks |
| Zulip | Streams/topics, messages, threads, reactions (optional) | Zulip REST API + event queue (long-poll) for near-real-time |
| Figma | Files, frames/comments, comment threads, version history metadata | Figma REST API (webhooks for comment/file events) |
| Notion | Pages, databases, blocks, comments, page history | Notion API |

Each connector should capture: content body, author, timestamps (created/updated), permalink back to source, thread/parent relationships, and any tags/labels/status fields native to that platform.

## 7. Functional Requirements

### 7.1 Ingestion / Connectors
- Per-platform connector with authenticated API access (OAuth or token-based, per platform's model).
- Initial full backfill per source, then incremental sync (webhooks where available, polling as fallback).
- Rate-limit aware, resumable/idempotent (safe to re-run without duplicating data).
- Configurable scope per source (e.g., specific GitHub orgs/repos, specific Zulip streams, specific Figma projects, specific Notion workspaces/pages).

### 7.2 Normalization & Storage
- Common document schema: `{id, source, type, title, body, author, created_at, updated_at, url, parent_id/thread_id, related_ids, raw_metadata}`.
- Preserve relationships: PR ↔ commits ↔ issue; Zulip thread ↔ topic; Figma comment ↔ frame/file; Notion block ↔ page ↔ database.
- Store raw payload alongside normalized form (for reprocessing without re-fetching).
- Deduplication and update handling (edits/deletes on source should propagate).

### 7.3 Cross-Linking
- Detect and store explicit cross-references (e.g., a Zulip message linking a GitHub PR, a Notion doc linking a Figma file) so the KB can present unified "threads of context" around a topic/feature.

### 7.4 Search & Retrieval
- Full-text / keyword search across all sources.
- Semantic search (embeddings) for concept-level queries, not just keyword match.
- Filters by source, author, date range, content type.
- Every result shows provenance (source platform + deep link).

### 7.5 Q&A Interface
- Natural-language question answering grounded in the ingested corpus (RAG-style), with citations back to source documents.
- Should decline / flag when it lacks sufficient grounded context rather than fabricating.

### 7.6 Sync & Freshness
- Scheduled incremental sync per connector (interval configurable per source).
- Visibility into last-sync time and sync health/errors per source.

## 8. Non-Functional Requirements
- **Security**: credentials/tokens stored securely (secrets manager, not plaintext config); least-privilege API scopes per platform.
- **Privacy/Access control**: respect source-platform visibility where feasible (e.g., private repos/streams only ingested if explicitly authorized); flag this as an open design question for multi-user access (see below).
- **Auditability**: every ingested item traceable to its source and fetch time.
- **Extensibility**: adding a new source platform should not require reworking the core schema/storage/search layers.
- **Cost-awareness**: mindful of API rate limits and (if using LLM embeddings/Q&A) token costs at corpus scale.

## 9. Success Metrics
- Coverage: % of target repos/streams/files/workspaces successfully connected and ingested.
- Freshness: median time from source update to appearing in KB.
- Search quality: qualitative — can a user find/answer a known cross-platform question correctly, with correct citation.
- Adoption: number of queries/searches run by the team per week after rollout.

## 10. Open Questions
1. **Access control model** — should the KB mirror per-user permissions from each source (e.g., private Notion pages only visible to those who could see them originally), or is this a single-trusted-audience internal tool? This materially affects architecture.
2. **Hosting** — self-hosted/local vs. cloud service? Any constraints (company policy, budget)?
3. **Scale** — rough size of each source (# repos, # Zulip messages/streams, # Figma files, # Notion pages) to size storage/indexing approach.
4. **Q&A interface** — chat UI, Slack/Zulip bot, CLI, or embedded search bar? Who are the actual day-to-day users?
5. **Update handling** — do we need to track *edit history* (e.g., a Notion page's revision history) or just latest state?
6. **Source of truth conflicts** — if the same topic is documented differently across platforms, does the KB surface all versions or attempt reconciliation?

## 11. Proposed Phasing (high-level)
- **Phase 1**: Single-source pipeline (pick GitHub first) end-to-end: connector → normalized store → search. Validates architecture.
- **Phase 2**: Add Zulip + Notion + Figma connectors using the same pipeline pattern.
- **Phase 3**: Cross-linking between sources + semantic search.
- **Phase 4**: Grounded Q&A interface with citations.
- **Phase 5**: Incremental sync hardening, access control, monitoring/observability.

## 12. Risks
- API rate limits / access restrictions per platform (especially Figma, Notion) could slow backfill.
- Access-control mismatch could leak content beyond intended audience if not designed carefully.
- Corpus growth over time increasing storage/embedding costs.
- Platform API changes/deprecations breaking connectors.
