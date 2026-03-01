# Phase 0 Results: Testing 20 MCP Servers

**Date:** 2026-03-01  
**Method:** Fresh `npx -y <package>` — exactly what any developer does

---

## Raw Numbers

| Metric | Result |
|--------|--------|
| Servers tested | 20 |
| **Fully working** | **7 / 20 (35%)** |
| **Broken** | **13 / 20 (65%)** |
| Start successfully | 8 / 20 |
| Respond to initialize | 8 / 20 |
| list_tools works | 7 / 20 |
| Invalid inputSchema | 1 / 20 |

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

## Breakdown of Failures (13 servers)

### Category 1: Should work but don't (no API key needed) — 5 servers
- `@modelcontextprotocol/server-fetch` — Official Anthropic server, no env needed. Hangs.
- `mcp-server-sqlite` — Needs only a file path. Hangs.
- `mcp-pandoc` — Needs pandoc CLI, but gives **no error message**, just hangs.
- `mcp-weather` — Hangs silently.
- `mcp-server-time` — Official-adjacent, should work. Hangs.

### Category 2: Need external service (DB, Redis) — 3 servers
- `mcp-server-postgres` — Needs Postgres instance.
- `mcp-server-redis` — Needs Redis instance.
- `mcp-server-puppeteer` — Needs Chrome browser.

### Category 3: Need API key (but give no helpful error) — 3 servers
- `mcp-server-brave-search` — Needs BRAVE_API_KEY. No error, just hangs.
- `mcp-server-browserbase` — Needs API key.
- `mcp-server-ticketmaster` — Needs API key.

### Category 4: Invalid MCP spec — 1 server
- `mcp-obsidian` — Passes initialize, but **inputSchema.type is not "object"**, violating MCP spec.

### Category 5: Missing dependency (silent) — 1 server
- `mcp-pandoc` — Requires `pandoc` CLI installed. Gives no error, just hangs.

---

## Key Findings

1. **65% of tested servers fail** for a developer who just runs `npx -y <package>`.

2. **Even official Anthropic servers fail**: `server-fetch` and `server-time` hang without any error message.

3. **Failures are silent**: Servers don't crash with a useful error. They just... hang. No "missing API key", no "pandoc not found". Just timeout.

4. **The worst case**: `mcp-obsidian` starts, initializes, but returns tools with an invalid schema that breaks MCP clients silently.

5. **No way to know before using**: Every failure required me to debug manually. There is no `npm test` equivalent for MCP.

6. **Startup times vary wildly**: from 1.1s (filesystem) to 12.9s (mcp-fetch). No standard.

---

## What This Means for mcpkit

The pain is real and well-documented. The core value proposition of `mcpkit test` is validated:
- Automated startup check
- Detect silent hangs (the most common failure)
- Validate inputSchema (catches mcp-obsidian type of bug)
- Clear error messages for missing env vars
- Consistent test output for CI/CD
