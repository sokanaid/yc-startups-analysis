# Phase 3: Private Registry + Paid (первые деньги)

## Цель
Компании могут хостить свои внутренние MCP-серверы в приватном registry. Это первый платный продукт.

## Срок: 1-2 недели с агентом
## Начинать: только если есть 5+ запросов на private registry от реальных компаний

---

## Архитектура

Два варианта (начать с варианта A):

### Вариант A: Self-hosted (проще, быстрее)
- Пользователь поднимает свой registry-сервер (Docker контейнер)
- CLI подключается к нему: `mcpkit config set registry https://mcp.company.com`
- Данные в SQLite (один файл, бэкапится просто)
- **Бесплатно** — open source

### Вариант B: Hosted (деньги)
- Мы хостим registry в облаке
- Пользователь: `mcpkit login` → `mcpkit publish`
- **Платно** — $49/мес за команду

**Стратегия:** Вариант A даёт adoption. Вариант B даёт revenue. Строить оба, но A — open source, B — hosted service поверх того же кода.

---

## Стек (бэкенд registry-сервера)

| Что | Технология | Почему |
|-----|-----------|--------|
| Runtime | Node.js / Hono или Fastify | Лёгкий, быстрый |
| БД | SQLite (self-hosted) / Postgres (hosted) | SQLite = один файл, ноль DevOps |
| ORM | Drizzle | Поддерживает SQLite и Postgres |
| Auth | API key (v1), потом OAuth | Простейшее |
| Хостинг (B) | Fly.io или Railway | Дёшево, просто |
| Docker | Dockerfile для self-hosted | Стандарт |

---

## API (registry-сервер)

```
# Публичные (без auth)
GET  /api/v1/servers                    # Список всех серверов
GET  /api/v1/servers/:name              # Детали сервера
GET  /api/v1/servers/search?q=database  # Поиск

# Приватные (с API key)
POST /api/v1/servers                    # Опубликовать сервер
PUT  /api/v1/servers/:name              # Обновить
DELETE /api/v1/servers/:name            # Удалить

# Auth
POST /api/v1/auth/register             # Создать аккаунт (hosted)
POST /api/v1/auth/login                # Получить API key
GET  /api/v1/auth/me                   # Текущий юзер

# Team
POST /api/v1/teams                     # Создать команду
POST /api/v1/teams/:id/members         # Добавить участника
GET  /api/v1/teams/:id/servers         # Серверы команды
```

---

## CLI команды (добавить)

```bash
# Авторизация
mcpkit login                            # Для hosted
mcpkit login --registry https://mcp.company.com  # Для self-hosted

# Публикация
mcpkit publish                          # Из текущей директории
mcpkit publish --private                # Приватный сервер (только для команды)

# Управление registry
mcpkit config set registry https://mcp.company.com
mcpkit config get registry

# Переключение между public и private
mcpkit install stripe                   # Из public
mcpkit install --registry private internal-crm  # Из private
```

---

## Формат публикации (mcpkit.json в репо сервера)

```json
{
  "name": "internal-crm",
  "version": "1.2.0",
  "description": "MCP server for internal CRM",
  "transport": "stdio",
  "command": "node",
  "args": ["dist/index.js"],
  "requiredEnv": ["CRM_API_KEY", "CRM_BASE_URL"],
  "tags": ["crm", "internal"],
  "private": true
}
```

`mcpkit publish` читает этот файл + прогоняет `mcpkit test` автоматически перед публикацией. Не прошёл тест — не публикуется.

---

## Docker (self-hosted)

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
ENV DATABASE_URL=file:./data/mcpkit.db
VOLUME ["/app/data"]
CMD ["node", "dist/server.js"]
```

```bash
docker run -d \
  -p 3000:3000 \
  -v mcpkit-data:/app/data \
  --name mcpkit-registry \
  mcpkit/registry
```

---

## Прайсинг (hosted)

| План | Цена | Что включено |
|------|------|--------------|
| Free | $0 | 3 private серверов, 1 юзер |
| Team | $49/мес | Unlimited private, 10 юзеров, analytics |
| Business | $149/мес | Unlimited всё, SSO, audit log, priority support |

---

## Страница оплаты
- Stripe Checkout (минимальный UI)
- Landing page: одна страница на mcpkit.dev

---

## Что НЕ делать в Phase 3
- ❌ Никакого SSO (Phase 4)
- ❌ Никакого audit log (Phase 4)
- ❌ Никакого web dashboard — всё через CLI
- ❌ Не усложнять: API key auth, SQLite, минимум

---

## Definition of Done
- [ ] Self-hosted registry работает в Docker
- [ ] `mcpkit publish` публикует сервер
- [ ] `mcpkit install --registry` устанавливает из приватного
- [ ] `mcpkit test` запускается автоматически перед publish
- [ ] Hosted версия на Fly.io / Railway
- [ ] Stripe подключён, оплата работает
- [ ] Landing page mcpkit.dev
- [ ] Первый платящий клиент
