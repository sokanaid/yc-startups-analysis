# Phase 4: Auth Proxy — безопасность MCP

## Цель
Прокси между AI-агентом и MCP-сервером: контролирует кто какие tools вызывает, логирует всё, блокирует опасные вызовы.

## Срок: 1-2 недели с агентом
## Начинать: только если есть 3+ платящих клиента из Phase 3 ИЛИ явные запросы на security

---

## Как работает

```
AI-агент (Cursor/Claude) → mcpkit proxy → MCP-сервер

Без прокси:
  Cursor → stdio → MCP-сервер (никакого контроля)

С прокси:
  Cursor → stdio → mcpkit-proxy → stdio → MCP-сервер
                       ↓
                   Логирование
                   Auth проверка
                   Фильтрация tool calls
                   Rate limiting
```

---

## CLI

```bash
# Запуск прокси для одного сервера
mcpkit proxy --server "npx -y @modelcontextprotocol/server-filesystem /tmp"

# С конфигом
mcpkit proxy --config mcpkit-proxy.yaml

# В конфиге клиента вместо сервера подставляется прокси:
# Было: "command": "npx", "args": ["-y", "@mcp/server-filesystem", "/tmp"]
# Стало: "command": "mcpkit", "args": ["proxy", "--config", "mcpkit-proxy.yaml"]

# Автоматическая установка с прокси
mcpkit install filesystem --with-proxy
```

---

## Конфигурация (mcpkit-proxy.yaml)

```yaml
server:
  command: "npx"
  args: ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]

auth:
  type: "api-key"             # api-key | none
  keys:
    - name: "dev-team"
      key: "mk_dev_abc123"
      permissions:
        allowedTools: ["read_file", "list_directory", "search_files"]
        deniedTools: ["write_file", "edit_file", "move_file"]
    - name: "admin"
      key: "mk_admin_xyz789"
      permissions:
        allowedTools: ["*"]

logging:
  enabled: true
  output: "./logs/mcp-proxy.jsonl"  # JSONL формат, одна строка на вызов
  logLevel: "info"                  # debug | info | warn | error

filters:
  # Блокировать tool calls с определёнными аргументами
  - tool: "write_file"
    block_if:
      path_contains: ["/etc/", "/usr/", "~/.ssh/"]
  - tool: "execute_command"
    block_always: true              # Полностью заблокировать опасный tool

rateLimit:
  enabled: false
  maxCallsPerMinute: 60
```

---

## Формат логов (JSONL)

```json
{"ts":"2026-03-01T10:15:32Z","type":"tool_call","tool":"read_file","args":{"path":"/tmp/test.txt"},"auth":"dev-team","result":"success","duration":45}
{"ts":"2026-03-01T10:15:33Z","type":"tool_call","tool":"write_file","args":{"path":"/etc/passwd","content":"..."},"auth":"dev-team","result":"blocked","reason":"path_contains /etc/","duration":1}
{"ts":"2026-03-01T10:15:34Z","type":"tool_list","auth":"dev-team","tools_returned":3,"tools_filtered":2,"duration":12}
```

---

## Структура проекта (добавить)

```
mcpkit/
├── src/
│   ├── proxy/
│   │   ├── server.ts          # Прокси как MCP-сервер (принимает запросы от агента)
│   │   ├── client.ts          # Прокси как MCP-клиент (пересылает реальному серверу)
│   │   ├── middleware/
│   │   │   ├── auth.ts        # Проверка API key
│   │   │   ├── filter.ts      # Фильтрация tool calls
│   │   │   ├── rate-limit.ts  # Rate limiting
│   │   │   └── logger.ts      # Логирование в JSONL
│   │   ├── config.ts          # Парсинг mcpkit-proxy.yaml
│   │   └── index.ts
│   └── ...
```

---

## Техническая реализация

Прокси — это MCP-сервер, который внутри содержит MCP-клиент:

```
1. AI-агент подключается к прокси как к обычному MCP-серверу (stdio)
2. Прокси получает запрос (tools/list, tools/call, etc.)
3. Прокси проверяет: auth → filter → rate limit
4. Если ОК — пересылает реальному серверу
5. Получает ответ от реального сервера
6. Логирует
7. Возвращает ответ агенту

tools/list → прокси фильтрует: убирает tools которые denied для этого API key
tools/call → прокси проверяет: разрешён ли этот tool? не заблокирован ли аргумент?
```

---

## Сценарий пользователя

```bash
$ mcpkit install filesystem --with-proxy

  ✅ Server "filesystem" configured with proxy
  
  Proxy config saved to: ~/.mcpkit/proxies/filesystem.yaml
  
  Default policy: all tools allowed, logging enabled
  Edit policy: mcpkit proxy config filesystem

$ mcpkit proxy logs filesystem --tail

  10:15:32 ✅ read_file /tmp/test.txt (45ms) [dev-team]
  10:15:33 🚫 write_file /etc/passwd — BLOCKED (path_contains /etc/) [dev-team]
  10:15:34 ✅ list_directory /tmp (12ms) [dev-team]
```

---

## Платные фичи (добавить к прайсингу)

| Фича | Free | Team $49 | Business $149 |
|------|------|----------|---------------|
| Прокси (локальный) | ✅ | ✅ | ✅ |
| Логи (локальный файл) | ✅ | ✅ | ✅ |
| API key auth | 1 ключ | Unlimited | Unlimited |
| Фильтрация | Базовая | Полная | Полная |
| Cloud logs (hosted) | ❌ | ✅ | ✅ |
| SSO (Okta/Azure AD) | ❌ | ❌ | ✅ |
| Audit trail (compliance) | ❌ | ❌ | ✅ |
| PII filtering | ❌ | ❌ | ✅ |

---

## Что НЕ делать в Phase 4
- ❌ SSO — только если есть конкретный enterprise запрос
- ❌ Web dashboard для логов — CLI + файл достаточно
- ❌ PII filtering — сложно, позже
- ❌ Multi-server proxy — один прокси на один сервер

---

## Definition of Done
- [ ] `mcpkit proxy --config proxy.yaml` работает
- [ ] API key auth фильтрует tools
- [ ] Логирование в JSONL
- [ ] Фильтрация по аргументам работает
- [ ] `mcpkit install --with-proxy` автоматически настраивает
- [ ] Документация
- [ ] Обновлён npm пакет
