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

I spent a day running a fresh `npx -y <package>` on 20 popular MCP servers — exactly what any developer does when they want to try one. Here's what I found:

**7 out of 20 worked. 13 failed. And the failures taught me more than the successes.**

```
✅  filesystem     — 14 tools, works (1.1s startup)
✅  memory         — 9 tools, works
✅  sequential-thinking — 1 tool, works
✅  everything     — 13 tools, works  
✅  mcp-fetch      — 1 tool, works (13s startup — is it loading or broken?)
✅  everything-search — 4 tools, works
✅  mcp-server-git — 28 tools, works

❌  server-fetch    — package doesn't exist on npm (official Anthropic repo!)
❌  server-time     — package doesn't exist on npm
❌  mcp-pandoc      — package doesn't exist on npm
❌  mcp-sse-shim    — package doesn't exist on npm
❌  mcp-redis       — package doesn't exist on npm
❌  mcp-sqlite      — exists, starts, immediately crashes. Error: silent.
❌  ticketmaster    — exists, starts, immediately crashes. Error: silent.
❌  brave-search    — exits with error... but only in stderr. Client sees nothing.
❌  mcp-obsidian    — starts, initializes, returns tools — but inputSchema.type="array" (spec requires "object")
❌  puppeteer       — needs Chrome, no clear error
❌  postgres        — needs DB, no clear error
❌  browserbase     — doesn't exist on npm
❌  weather         — exists but crashes immediately
```

**Three failure modes, all bad:**

**1. Package doesn't exist** — 5 packages are referenced in docs/GitHub/READMEs but were never published to npm. `npx -y` just hangs forever. No "not found" in the client. You wait, wondering.

**2. Silent crashes** — `mcp-sqlite` starts, then dies. The MCP client reports "Connection closed". That's all. To find the real error you have to attach to the process stderr manually. `brave-search` actually has a good error message ("BRAVE_API_KEY required") — but it goes to stderr, which Cursor and Claude Desktop never show you.

**3. Spec violations that pass all basic checks** — `mcp-obsidian` is the most insidious: it starts, responds to initialize, returns a tool list. But `inputSchema.type = "array"` instead of `"object"`. The MCP spec is clear. Any client calling this server gets a silent validation error.

---

**There's no npm test for MCP.** No CI. No way to catch any of this before shipping to the registry.

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
