# Phase 0 Results: Testing 20 MCP Servers

**Date:** 2026-03-01  
**Method:** Fresh `npx -y <package>` — exactly what any developer does

> **Important note after deeper investigation:** 5 of the 20 servers we initially picked
> don't exist on npm at all. The package names are referenced in docs/GitHub repos,
> but were never published. This is itself a finding — the discovery problem is broken.

---

## Raw Numbers

| Metric | Result |
|--------|--------|
| Servers tested | 20 |
| **Packages don't exist on npm** | **5 / 20** |
| **Fully working** | **7 / 20 (35%)** |
| **Broken (exist but fail)** | **8 / 20 (40%)** |
| Start but close immediately | 3 / 20 |
| Invalid inputSchema | 1 / 20 |
| Need external service (DB/Redis) | 2 / 20 |
| Need API key (exit with error) | 2 / 20 |

---

## Detailed Results

| # | Server | Category | ✅/❌ | Tools | Init ms | Failure reason |
|---|--------|----------|-------|-------|---------|----------------|
| 1 | filesystem | Official | ✅ | 14 | 1115ms | — |
| 2 | memory | Official | ✅ | 9 | 2197ms | — |
| 3 | fetch | Official | ❌ | — | — | Hard timeout — won't start |
| 4 | sequential-thinking | Official | ✅ | 1 | 2956ms | — |
| 5 | everything | Official | ✅ | 13 | 2805ms | — |
| 6 | mcp-server-sqlite | Community | ❌ | — | — | Hard timeout — won't start |
| 7 | mcp-pandoc | Community | ❌ | — | — | Hard timeout (needs pandoc CLI) |
| 8 | mcp-server-fetch (@kazuph) | Community | ✅ | 1 | 12958ms | — (very slow) |
| 9 | mcp-obsidian | Community | ❌ | — | — | **Invalid inputSchema** — type not "object" |
| 10 | mcp-server-browserbase | Community | ❌ | — | — | Hard timeout (needs API key) |
| 11 | mcp-server-brave-search | Official | ❌ | — | — | Hard timeout (needs BRAVE_API_KEY) |
| 12 | mcp-server-puppeteer | Official | ❌ | — | — | Hard timeout (needs Chrome) |
| 13 | mcp-weather | Community | ❌ | — | — | Hard timeout — won't start |
| 14 | everything-search | Community | ✅ | 4 | 5970ms | — |
| 15 | mcp-server-redis | Community | ❌ | — | — | Hard timeout (needs Redis) |
| 16 | mcp-server-time | Official | ❌ | — | — | Hard timeout — **should work, doesn't** |
| 17 | mcp-sse-shim | Community | ❌ | — | — | Hard timeout — won't start |
| 18 | mcp-server-ticketmaster | Community | ❌ | — | — | Hard timeout (needs API key) |
| 19 | mcp-server-postgres | Official | ❌ | — | — | Hard timeout (needs DB) |
| 20 | mcp-server-git | Community | ✅ | 28 | 5662ms | — |

---

## Breakdown of Failures

### Category 1: Package doesn't exist on npm — 5 servers ← NEW FINDING
These are referenced in documentation/GitHub repos but were **never published to npm**.
`npx -y` silently hangs waiting for download that will never complete.

- `@modelcontextprotocol/server-fetch` — Official Anthropic repo, not on npm
- `@modelcontextprotocol/server-time` — Not on npm
- `mcp-pandoc` — Not on npm
- `@geffzhang/mcp-server-redis` — Not on npm
- `mcp-sse-shim` — Not on npm
- `@browserbasehq/mcp-browserbase` — Not on npm

### Category 2: Starts then closes immediately — 3 servers
These crash on startup. The MCP SDK reports "Connection closed" — no useful error in the client.
But if you read stderr: one of them actually gives a good error, others crash silently.

- `mcp-server-sqlite` — Crashes immediately. stderr: just `process terminated`. No reason given.
- `@modelcontextprotocol/server-brave-search` — Exits with `Error: BRAVE_API_KEY environment variable is required` (stderr only — client never sees this)
- `@delorenj/mcp-server-ticketmaster` — Exits silently

### Category 3: Need external service — 2 servers
Expected to fail, but still give no useful error message to the user.

- `@modelcontextprotocol/server-postgres` — Needs Postgres DB running
- `@modelcontextprotocol/server-puppeteer` — Needs Chrome

### Category 4: Invalid MCP spec — 1 server
- `mcp-obsidian` — Starts, initializes, returns tools — but `inputSchema.type = "array"` instead of `"object"`. Violates MCP spec. Breaks clients silently.

### Category 5: Unclear / unknown — 1 server
- `mcp-weather` — Exits. Reason unknown without deeper investigation.

---

## Key Findings (updated after deeper investigation)

1. **5 out of 20 package names we tried don't exist on npm** — referenced in docs/GitHub but never published. `npx -y` just hangs forever with no explanation. There is no way to know without trying.

2. **Of servers that DO exist, 8/15 (53%) fail** when you run them fresh.

3. **The #1 failure mode: silent crash**. `mcp-server-sqlite` starts, then dies immediately. The MCP client sees "Connection closed". The developer sees nothing. There is no "here's what went wrong" message in the protocol.

4. **`brave-search` actually gives a good error** — but only in `stderr`. Any tool that wraps the server (Cursor, Claude Desktop) never shows you this. You just see "server not available".

5. **`mcp-obsidian` passes all basic checks but is silently broken**: valid startup, valid tools list, but `inputSchema.type = "array"` — the MCP spec requires "object". Any agent calling it gets an SDK validation error.

6. **Startup times vary 10x**: 1.1s to 13s. No standard. Users don't know if it's loading or broken.

7. **The discovery problem is as bad as the quality problem**: no canonical npm naming, servers exist only on GitHub, no way to check if a package is published before trying.

---

## What This Means for mcpkit

The pain is real and well-documented. The core value proposition of `mcpkit test` is validated:
- Automated startup check
- Detect silent hangs (the most common failure)
- Validate inputSchema (catches mcp-obsidian type of bug)
- Clear error messages for missing env vars
- Consistent test output for CI/CD
