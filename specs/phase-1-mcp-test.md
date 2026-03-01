# Phase 1: mcp test — CLI тест-фреймворк

## Цель
CLI утилита: `npx mcpkit test ./path-to-server` — автоматически запускает MCP-сервер и проверяет что он работает.

## Срок: 3-7 дней с агентом

---

## Название пакета
- npm: `mcpkit`
- GitHub: `mcpkit/mcpkit`
- Команда: `mcpkit test`

**Сразу забронировать:** `npm init --scope=mcpkit`, создать GitHub org `mcpkit`.

---

## Стек

| Что | Технология | Почему |
|-----|-----------|--------|
| Язык | TypeScript (strict) | Экосистема MCP на TS, типизация |
| Runtime | Node.js ≥ 18 | LTS, нативный fetch |
| CLI framework | Commander.js | Стандарт, лёгкий |
| Валидация | Zod | Стандарт в MCP SDK |
| Вывод в терминал | chalk + ora | Красивый output |
| Тесты (самого фреймворка) | Vitest | Быстрый, TS из коробки |
| Сборка | tsup | Быстрый bundler для CLI |
| Линтер | ESLint + Prettier | Стандарт |

---

## Структура проекта

```
mcpkit/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
├── README.md
├── LICENSE                  # MIT
├── src/
│   ├── index.ts             # CLI entry point
│   ├── cli.ts               # Commander setup
│   ├── runner/
│   │   ├── spawn.ts         # Запуск MCP-сервера как child process
│   │   ├── transport.ts     # Подключение через stdio transport
│   │   └── timeout.ts       # Таймауты для всех операций
│   ├── checks/
│   │   ├── startup.ts       # Проверка: сервер запускается
│   │   ├── list-tools.ts    # Проверка: list_tools возвращает массив
│   │   ├── tool-schema.ts   # Проверка: каждый tool имеет name, description, inputSchema
│   │   ├── tool-call.ts     # Проверка: вызов tool не крашит сервер
│   │   ├── list-resources.ts # Проверка: list_resources (если есть)
│   │   ├── list-prompts.ts  # Проверка: list_prompts (если есть)
│   │   └── index.ts         # Экспорт всех проверок
│   ├── reporter/
│   │   ├── console.ts       # Красивый вывод в терминал (✅ ❌)
│   │   ├── json.ts          # JSON output для CI
│   │   └── index.ts
│   ├── config/
│   │   ├── loader.ts        # Загрузка mcpkit.config.json (опционально)
│   │   └── types.ts         # Типы конфигурации
│   └── utils/
│       ├── logger.ts
│       └── errors.ts
├── tests/
│   ├── checks/
│   │   ├── startup.test.ts
│   │   ├── list-tools.test.ts
│   │   └── tool-schema.test.ts
│   └── fixtures/
│       ├── working-server/   # Тестовый MCP-сервер который работает
│       └── broken-server/    # Тестовый MCP-сервер который ломается
└── examples/
    └── basic-test/
```

---

## CLI API

### Основная команда

```bash
# Тестировать сервер по пути
mcpkit test ./my-server

# Тестировать с конкретной командой запуска
mcpkit test --command "node dist/index.js"

# Тестировать с аргументами
mcpkit test --command "npx -y @modelcontextprotocol/server-filesystem /tmp"

# JSON output для CI
mcpkit test ./my-server --format json

# Таймаут (по умолчанию 30 сек)
mcpkit test ./my-server --timeout 60000

# Пропустить tool calls (только валидация схем)
mcpkit test ./my-server --skip-calls

# Verbose
mcpkit test ./my-server --verbose
```

### Конфигурационный файл (опционально)

`mcpkit.config.json`:
```json
{
  "command": "node dist/index.js",
  "args": ["/tmp"],
  "env": {
    "API_KEY": "test-key"
  },
  "timeout": 30000,
  "skipCalls": false,
  "checks": {
    "startup": true,
    "listTools": true,
    "toolSchema": true,
    "toolCall": true,
    "listResources": true,
    "listPrompts": true
  }
}
```

---

## Проверки (checks) — подробно

### Check 1: Startup
```
Что делает:
1. Запускает сервер как child process (stdio transport)
2. Ждёт что процесс не крашится в первые 5 секунд
3. Посылает `initialize` request по MCP протоколу
4. Проверяет что получает `InitializeResult` с:
   - protocolVersion
   - capabilities
   - serverInfo (name, version)

Результат:
  ✅ Server starts and responds to initialize
  ❌ Server crashes on startup: [error message]
  ❌ Server does not respond to initialize within 5s
```

### Check 2: List Tools
```
Что делает:
1. Вызывает tools/list
2. Проверяет что ответ — массив
3. Проверяет что массив не пустой (предупреждение если пуст)
4. Возвращает количество tools

Результат:
  ✅ tools/list returns 5 tools
  ⚠️ tools/list returns 0 tools (empty)
  ❌ tools/list failed: [error]
```

### Check 3: Tool Schema Validation
```
Что делает для каждого tool:
1. Проверяет наличие name (string, не пустой)
2. Проверяет наличие description (string, не пустой) — предупреждение если нет
3. Проверяет inputSchema — валидный JSON Schema
4. Проверяет что inputSchema.type === "object"
5. Проверяет что required fields есть в properties

Результат (для каждого tool):
  ✅ tool "create_payment" — valid schema
  ⚠️ tool "list_users" — missing description
  ❌ tool "delete_user" — invalid inputSchema: properties.id missing type
```

### Check 4: Tool Call (dry run)
```
Что делает:
1. Для каждого tool генерирует минимальный валидный input по inputSchema
   - string → "test"
   - number → 0
   - boolean → false
   - array → []
   - object → {}
2. Вызывает tools/call
3. Проверяет что сервер НЕ крашится (не ожидаем успешный результат — может вернуть ошибку и это ок)
4. Проверяет что ответ соответствует MCP формату (content array с type/text)

Результат:
  ✅ tool "search" — responds (returned error, but didn't crash)
  ✅ tool "list" — responds with valid content
  ❌ tool "delete" — server crashed
  ❌ tool "update" — timeout (30s)
```

### Check 5: List Resources (опционально)
```
Что делает:
1. Проверяет capabilities.resources
2. Если есть — вызывает resources/list
3. Валидирует формат ответа

Результат:
  ✅ resources/list returns 3 resources
  ⏭️ Server does not support resources (skipped)
  ❌ resources/list failed: [error]
```

### Check 6: List Prompts (опционально)
```
Что делает:
1. Проверяет capabilities.prompts
2. Если есть — вызывает prompts/list
3. Валидирует формат ответа

Результат:
  ✅ prompts/list returns 2 prompts
  ⏭️ Server does not support prompts (skipped)
```

---

## Вывод в терминал

```
 mcpkit test v0.1.0

 Testing: @modelcontextprotocol/server-filesystem
 Command: npx -y @modelcontextprotocol/server-filesystem /tmp

 ✅ Startup ................ server responds to initialize (1.2s)
 ✅ List Tools ............. 11 tools found (0.3s)
 ✅ Tool Schemas ........... 11/11 valid (0.1s)
 ⚠️  Tool "read_file" ...... missing description
 ✅ Tool Calls ............. 11/11 respond without crash (4.2s)
 ⏭️  Resources ............. not supported (skipped)
 ⏭️  Prompts ............... not supported (skipped)

 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Result: 4 passed, 1 warning, 0 failed
 Time:   5.8s

 Server info: filesystem-server v0.6.2 (MCP 2025-03-26)
 Tools: read_file, read_multiple_files, write_file, edit_file, 
        create_directory, list_directory, directory_tree,
        move_file, search_files, get_file_info, list_allowed_directories
```

---

## JSON output (для CI)

```json
{
  "version": "0.1.0",
  "server": {
    "name": "filesystem-server",
    "version": "0.6.2",
    "protocolVersion": "2025-03-26"
  },
  "checks": {
    "startup": { "status": "pass", "duration": 1200 },
    "listTools": { "status": "pass", "count": 11, "duration": 300 },
    "toolSchemas": {
      "status": "warn",
      "passed": 11,
      "warnings": 1,
      "failed": 0,
      "details": [
        { "tool": "read_file", "status": "warn", "message": "missing description" }
      ]
    },
    "toolCalls": { "status": "pass", "passed": 11, "failed": 0, "duration": 4200 },
    "resources": { "status": "skip" },
    "prompts": { "status": "skip" }
  },
  "summary": {
    "passed": 4,
    "warnings": 1,
    "failed": 0,
    "duration": 5800
  }
}
```

---

## package.json

```json
{
  "name": "mcpkit",
  "version": "0.1.0",
  "description": "Test framework for MCP servers",
  "bin": {
    "mcpkit": "./dist/index.js"
  },
  "type": "module",
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "lint": "eslint src/",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["mcp", "model-context-protocol", "testing", "ai", "llm"],
  "license": "MIT",
  "engines": {
    "node": ">=18"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest",
    "commander": "^12.0.0",
    "zod": "^3.23.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "tsup": "^8.0.0",
    "vitest": "^2.0.0",
    "@types/node": "^20.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0"
  }
}
```

---

## Ключевые технические детали

### Запуск MCP-сервера (spawn.ts)
```typescript
// Используем StdioClientTransport из MCP SDK
// Сервер запускается как child_process
// Коммуникация через stdin/stdout (JSON-RPC 2.0)

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// 1. Создать transport с командой запуска сервера
// 2. Создать Client
// 3. client.connect(transport)
// 4. Выполнить проверки через client.listTools(), client.callTool(), etc.
// 5. client.close()
```

### Генерация тестовых данных для tool call (tool-call.ts)
```typescript
// По JSON Schema генерируем минимальный валидный объект
// string -> "test"
// number -> 0  
// integer -> 0
// boolean -> false
// array -> []
// object -> {}
// enum -> первый элемент
// Если есть required — генерируем только required поля
```

---

## README.md для GitHub

Должен содержать:
1. Красивый ASCII-арт или баннер
2. Одну строку: "Test your MCP servers automatically"
3. Quick start: `npx mcpkit test --command "npx -y @modelcontextprotocol/server-filesystem /tmp"`
4. Скриншот вывода в терминале
5. Таблица проверок
6. Конфигурация
7. CI/CD пример (GitHub Actions workflow)
8. Contributing guide
9. License (MIT)

---

## GitHub Actions workflow (для пользователей)

```yaml
# .github/workflows/mcp-test.yml
name: MCP Server Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - run: npx mcpkit test --command "node dist/index.js" --format json
```

---

## Что НЕ делать в Phase 1
- ❌ Никакого web UI
- ❌ Никакого registry
- ❌ Никакой авторизации
- ❌ Никаких платных фич
- ❌ Никакого хостинга
- ❌ Не тратить больше 1 недели

---

## Definition of Done
- [ ] `npx mcpkit test --command "..."` работает
- [ ] 6 checks проходят на 3+ реальных MCP-серверах
- [ ] JSON output работает
- [ ] README с quick start
- [ ] Опубликован на npm
- [ ] Опубликован на GitHub (MIT license)
- [ ] Пост "mcpkit — open-source test framework for MCP servers" на HN
