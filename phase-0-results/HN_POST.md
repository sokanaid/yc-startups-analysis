# HN Post: "Show HN: I tested 20 MCP servers. 13 failed silently."

---

## Заголовок (выбрать один)

**Вариант A (провокационный):**  
`Show HN: I tested 20 MCP servers. 13 failed. Most didn't even give an error.`

**Вариант B (технический):**  
`Show HN: mcpkit – an open-source test framework for MCP servers (65% fail silently)`

**Вариант C (вопрос):**  
`Ask HN: Why do 65% of MCP servers fail silently? (tested 20, results inside)`

**Рекомендация:** Вариант A или B. А — больше кликов, B — сразу про продукт.

---

## Текст поста

---

MCP (Model Context Protocol) has crossed 10,000 published servers and 97M monthly SDK downloads. But how many actually work?

I spent the last two days running a fresh `npx -y <package>` on 20 popular MCP servers — exactly what any developer does when they want to try one. Here's what I found:

**7 out of 20 worked. 13 failed.**

The breakdown:

```
✅  filesystem     — 14 tools, works perfectly
✅  memory         — 9 tools, works
✅  sequential-thinking — 1 tool, works
✅  everything     — 13 tools, works  
✅  mcp-fetch      — 1 tool, works (but takes 13 seconds to start)
✅  everything-search — 4 tools, works
✅  mcp-server-git — 28 tools, works

❌  fetch          — official Anthropic server, no env needed. Just... hangs.
❌  mcp-server-time — should work. Hangs silently.
❌  mcp-sqlite     — needs only a file path. Hangs.
❌  mcp-pandoc     — needs pandoc CLI, gives zero error. Hangs.
❌  mcp-obsidian   — starts, initializes, but returns invalid inputSchema
❌  brave-search   — needs API key, gives no error. Hangs.
❌  puppeteer      — needs Chrome, gives no error. Hangs.
❌  browserbase    — needs API key. Hangs.
❌  postgres       — needs DB. Hangs.
❌  redis          — needs Redis. Hangs.
❌  weather        — unclear. Hangs.
❌  sse-shim       — unclear. Hangs.
❌  ticketmaster   — needs API key. Hangs.
```

**The pattern:** Most failures are silent hangs. Not "missing BRAVE_API_KEY", not "pandoc not found". Just an unresponsive process with no output. You have no idea if it's still loading or broken forever.

The worst case was `mcp-obsidian`: it connects, responds to `initialize`, returns tool list — but the `inputSchema.type` is not "object", which violates the MCP spec and silently breaks any client trying to use it.

---

**Why this matters:**

There's no `npm test` for MCP servers. No CI/CD. No standard way to validate a server before publishing it. Developers are shipping broken servers to 10K+ registry entries and users have no idea until they try.

---

**What I'm building:**

I'm working on `mcpkit` — an open-source CLI that automatically tests MCP servers:

```bash
npx mcpkit test --command "npx -y @modelcontextprotocol/server-filesystem /tmp"
```

Output:
```
✅ Startup .............. responds to initialize (1.1s)
✅ List Tools ........... 14 tools found
✅ Tool Schemas ......... 14/14 valid
✅ Tool Calls ........... 14/14 respond without crash
━━━━━━━━━━━━━━━━━━━━━━━━━
Result: 4/4 checks passed
```

And for a broken server:
```
✅ Startup .............. responds to initialize (0.8s)
⚠️ List Tools ........... 3 tools (WARNING: tool "fetch_url" — inputSchema.type = "array", expected "object")
✅ Tool Calls ........... 3/3 respond
━━━━━━━━━━━━━━━━━━━━━━━━━
Result: 3/4 passed, 1 warning
```

Plus a GitHub Action so you can run this in CI on every PR.

---

GitHub: [link]  
npm: `npm install -g mcpkit`  
Waitlist for hosted features (private registry, CI dashboard): [link]

Feedback welcome — especially if you've built MCP servers and hit these issues.

---

## Twitter/X тред (после HN)

**Tweet 1:**
```
I tested 20 MCP servers by running npx -y <package>

Results: 7 worked. 13 failed silently.

The worst part: most failures give you ZERO error messages. Just a hanging process.

Thread 🧵
```

**Tweet 2:**
```
Even official @AnthropicAI servers fail:

@modelcontextprotocol/server-fetch — no API key needed, but just hangs
@modelcontextprotocol/server-time — should work out of the box, doesn't

65% failure rate on official + community servers
```

**Tweet 3:**
```
The most insidious failure:

mcp-obsidian starts ✅
Responds to initialize ✅  
Returns tool list ✅

But inputSchema.type = "array" instead of "object"

The MCP spec says it must be "object". No error. Silent breakage in your AI agent.
```

**Tweet 4:**
```
Root cause: there's no "npm test" for MCP servers.

No standard CI. No validation. Developers ship to the registry and users discover it's broken.

I'm building mcpkit to fix this.

npx mcpkit test --command "..." → instant health report

GitHub: [link]
```

---

## Waitlist форма (Google Form / Tally)

**Название:** mcpkit — MCP test framework  
**URL:** tally.so/r/mcpkit (создать)

**Вопросы:**
1. Email *
2. Do you build MCP servers? (Yes / No / Planning to)
3. How many MCP servers does your team maintain? (0 / 1-5 / 5-20 / 20+)
4. What's your biggest pain with MCP servers today? (free text)
5. Would you pay for hosted CI/CD for MCP servers? (Yes $29/mo / Maybe / No)

---

## Инструкция к публикации

### HN
1. Зайти на news.ycombinator.com/submit
2. Вставить заголовок (Вариант A или B)
3. Вставить URL = GitHub repo (если есть) или waitlist
4. Текст поста вставить в первый комментарий от своего имени

**Лучшее время:** Вторник-четверг, 8:00-10:00 AM ET (15:00-17:00 МСК)

### Twitter
1. Опубликовать тред из 4 твитов через 2-3 часа после HN поста
2. Тегнуть @AnthropicAI, @ModelContext

### Reddit
- r/LocalLLaMA: "I tested 20 MCP servers. 65% failed silently. Here's why."
- r/cursor: "MCP servers are broken. Here's proof + what to do about it."
- r/programming: (тот же заголовок что на HN)
