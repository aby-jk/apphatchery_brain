# Interface Outline: Unified Knowledge Repository

Assumption: primary interface is a web app (most flexible, satisfies both search/browse and Q&A use cases from the PRD's open question #4). Secondary/optional surfaces listed at the end.

## 1. Navigation Structure

- **Top bar**: global search/ask input (always accessible), source-connection status indicator, user menu.
- **Left sidebar**:
  - Ask / Search (home)
  - Browse by Source (GitHub / Zulip / Figma / Notion)
  - Topics (cross-source clusters)
  - Activity / Recent
  - Sources & Sync (admin/settings)

## 2. Core Screens

### 2.1 Ask / Home
- Single input box: free-text question or keyword query, toggle between "Ask" (grounded Q&A) and "Search" (raw results) modes.
- Below input: suggested/recent queries, freshness indicator ("last synced X ago" per source).
- Empty state: shortcuts to browse by source or view recent activity.

### 2.2 Answer View (Q&A mode)
- Generated answer at top, written in plain language.
- Inline citation markers → each maps to a source card (platform icon, title, snippet, permalink, author, timestamp).
- "Sources used" panel listing all cited documents, expandable to show excerpt.
- Explicit low-confidence/insufficient-context state ("I don't have grounded info on this") instead of a fabricated answer.
- Follow-up question input (conversational thread).

### 2.3 Search Results View (Search mode)
- Standard ranked list of results, each showing: source icon/badge, title, snippet with highlighted match, author, timestamp, content type (PR, issue, message, doc, comment, frame).
- Filters sidebar: source, content type, author, date range.
- Toggle: keyword vs. semantic search.
- Click-through opens Item Detail (in-app) or deep link to original platform.

### 2.4 Item Detail View
- Normalized rendering of the item (title, body, author, timestamps).
- "View on [Source]" deep link (primary provenance action).
- Related items panel: parent/child thread relationships, cross-linked items detected during ingestion (e.g., PR ↔ Zulip discussion ↔ Notion spec).
- Raw metadata (collapsed by default) for debugging/trust.

### 2.5 Browse by Source
- Per-platform tab (GitHub / Zulip / Figma / Notion), each with source-appropriate structure:
  - GitHub: repo → issues/PRs/commits list.
  - Zulip: stream → topic → messages.
  - Figma: project → file → comment threads.
  - Notion: workspace → page tree.
- Consistent filter/sort controls across tabs (date, author, type).

### 2.6 Topics View
- Auto- or manually-clustered groupings of cross-linked items around a subject (e.g., "Checkout Redesign").
- Each topic shows a merged timeline: mixed-source items in chronological order with source badges.
- Useful for onboarding / "catch me up on X" use case.

### 2.7 Activity / Recent
- Reverse-chronological feed of newly ingested/updated items across all sources.
- Filterable by source and type; primarily a freshness/monitoring view for active users.

### 2.8 Sources & Sync (Admin)
- List of configured connectors (GitHub, Zulip, Figma, Notion), each showing: connection status, scope (which repos/streams/files/workspaces), last sync time, error/health state.
- Actions: add new source, edit scope, trigger manual resync, revoke access.
- Not intended for general end users — gated to admins.

## 3. Shared Components

- **Source badge**: consistent icon + color per platform, used everywhere an item is listed.
- **Citation chip**: compact reference used in Answer View, expandable to full source card.
- **Freshness indicator**: relative timestamp + tooltip with absolute sync time, shown per source.
- **Provenance link**: every surfaced piece of content always carries a deep link back to its origin — non-negotiable, appears in every card/detail view.

## 4. Secondary Interfaces (future/optional, per PRD open question #4)

- **Zulip/Slack bot**: `/ask <question>` command returning the same grounded answer + citations inline in chat.
- **CLI**: scriptable search/ask for power users and automation.
- **API**: underlying REST/GraphQL endpoint the web app itself consumes, exposed for integrations.

## 5. Open Design Questions
- Does Ask mode need multi-turn memory (conversational context) or is each question independent?
- Should Topics be auto-clustered (embedding-based) or curated/manual initially?
- Admin vs. end-user role separation — is everyone an admin in v1, or is there a real permission boundary?
