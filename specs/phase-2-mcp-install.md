# Phase 2: mcp install — CLI + Public Registry

## Цель
`mcpkit install stripe` — одна команда, и MCP-сервер установлен, настроен, работает в Cursor/Claude/Cline.

## Срок: 1-2 недели с агентом
## Начинать: только если Phase 1 набрала 300+ GitHub stars или 100+ npm weekly downloads

---

## Что делает `mcpkit install`

1. Ищет сервер в registry (сначала — JSON-файл в репозитории, потом — API)
2. Скачивает/устанавливает (npm install -g или npx)
3. Определяет какой AI-клиент установлен (Cursor, Claude Desktop, Cline)
4. Автоматически добавляет конфиг в нужный файл
5. Показывает статус

---

## CLI API

```bash
# Установить сервер
mcpkit install filesystem
mcpkit install @modelcontextprotocol/server-filesystem

# Поиск
mcpkit search "database"
mcpkit search --tag sql

# Список установленных
mcpkit list

# Удалить
mcpkit remove filesystem

# Обновить все
mcpkit update

# Статус — какие серверы установлены, в каких клиентах
mcpkit status

# Показать куда пишет конфиг
mcpkit config --show
```

---

## Структура проекта (добавить к Phase 1)

```
mcpkit/
├── src/
│   ├── cli.ts                    # Добавить install/search/list/remove/update/status
│   ├── registry/
│   │   ├── client.ts             # Запросы к registry API
│   │   ├── types.ts              # Типы: ServerEntry, SearchResult
│   │   └── local-cache.ts        # Кеш registry на диске
│   ├── installer/
│   │   ├── npm.ts                # npm install -g / npx
│   │   ├── detect-client.ts      # Определить Cursor / Claude / Cline
│   │   ├── config-writer.ts      # Записать в конфиг клиента
│   │   └── index.ts
│   ├── clients/
│   │   ├── cursor.ts             # Путь к конфигу Cursor, формат
│   │   ├── claude-desktop.ts     # Путь к claude_desktop_config.json
│   │   ├── cline.ts              # Путь к конфигу Cline
│   │   └── types.ts
│   └── ...                       # Существующие файлы из Phase 1
├── registry/
│   └── servers.json              # Начальная база серверов (статический файл)
└── ...
```

---

## Registry формат (servers.json — v1, статический)

Первая версия — просто JSON-файл в репозитории. Никакого API-сервера.

```json
{
  "version": 1,
  "servers": [
    {
      "name": "filesystem",
      "package": "@modelcontextprotocol/server-filesystem",
      "description": "Read and write files on the local filesystem",
      "repository": "https://github.com/modelcontextprotocol/servers",
      "tags": ["files", "local", "official"],
      "author": "Anthropic",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "argsTemplate": ["${workspaceDir}"],
      "requiredEnv": [],
      "verified": true,
      "lastTested": "2026-02-28",
      "testResult": "pass"
    },
    {
      "name": "github",
      "package": "@modelcontextprotocol/server-github",
      "description": "Access GitHub repositories, issues, PRs",
      "repository": "https://github.com/modelcontextprotocol/servers",
      "tags": ["github", "git", "official"],
      "author": "Anthropic",
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "requiredEnv": ["GITHUB_PERSONAL_ACCESS_TOKEN"],
      "verified": true,
      "lastTested": "2026-02-28",
      "testResult": "pass"
    }
  ]
}
```

Наполнить: 30-50 серверов вручную (или скриптом из официального реестра).

---

## Конфиги AI-клиентов

### Cursor
Путь: `~/.cursor/mcp.json` (глобальный) или `.cursor/mcp.json` (проект)

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/projects"]
    }
  }
}
```

### Claude Desktop
Путь: `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/projects"]
    }
  }
}
```

### Cline (VS Code extension)
Путь: VS Code settings или `cline_mcp_settings.json`

---

## detect-client.ts — логика определения

```
1. Проверить наличие ~/.cursor/ → Cursor установлен
2. Проверить наличие ~/Library/Application Support/Claude/ → Claude Desktop
3. Проверить наличие ~/.vscode/extensions/ с cline → Cline
4. Спросить пользователя если несколько клиентов: "Куда установить? [cursor/claude/cline/all]"
5. Если ни одного: "No AI client detected. Config saved to ./mcpkit-servers.json"
```

---

## Сценарий пользователя

```bash
$ mcpkit install filesystem

  mcpkit install v0.2.0

  📦 Found: @modelcontextprotocol/server-filesystem
     "Read and write files on the local filesystem"
     Author: Anthropic | Verified ✅ | Last tested: 2026-02-28

  🔍 Detected AI clients:
     ✅ Cursor (~/.cursor/mcp.json)
     ✅ Claude Desktop

  📝 Adding to Cursor config...
     ⚠️  This server needs a directory argument.
     Enter path to allow access [/Users/me]: /Users/me/projects

  📝 Adding to Claude Desktop config...

  ✅ Installed! Server "filesystem" added to:
     • Cursor (restart Cursor to activate)
     • Claude Desktop (restart Claude to activate)

  💡 Test it: mcpkit test --command "npx -y @modelcontextprotocol/server-filesystem /Users/me/projects"
```

---

## Вывод `mcpkit search`

```bash
$ mcpkit search database

  mcpkit search v0.2.0

  Found 4 servers matching "database":

  NAME           PACKAGE                                    VERIFIED  TAGS
  postgres       @modelcontextprotocol/server-postgres      ✅        sql, database
  sqlite         @modelcontextprotocol/server-sqlite        ✅        sql, database, local
  mysql          @nicepkg/mcp-server-mysql                  ❌        sql, database
  supabase       mcp-server-supabase                        ❌        database, supabase

  Install: mcpkit install <name>
```

---

## Что НЕ делать в Phase 2
- ❌ Никакого API сервера (registry = JSON файл в GitHub)
- ❌ Никакого web UI для registry
- ❌ Никакого private registry
- ❌ Никакого аккаунта / регистрации
- ❌ Никаких платных фич

---

## Definition of Done
- [ ] `mcpkit install <name>` работает для 10+ серверов
- [ ] Автоматически определяет Cursor и Claude Desktop
- [ ] Автоматически пишет конфиг
- [ ] `mcpkit search` работает
- [ ] `mcpkit list` и `mcpkit remove` работают
- [ ] Registry из 30+ серверов в JSON
- [ ] Обновлён README
- [ ] Обновлён npm пакет
- [ ] Пост о новой фиче
