# Phase 0: Валидация идеи

## Цель
Проверить за 1-2 дня: нужен ли рынку MCP-тестирование? Без единой строки кода.

## Срок: 1-2 дня

---

## Шаг 1: Ручное тестирование 20 MCP-серверов (3-4 часа)

### Что делать
Взять 20 популярных MCP-серверов из официального реестра и попробовать:
1. Клонировать репозиторий
2. Установить зависимости (`npm install`)
3. Собрать (`npm run build`)
4. Запустить
5. Вызвать `list_tools`
6. Вызвать 1 инструмент

### Список серверов для проверки
Взять из https://github.com/modelcontextprotocol/servers:
1. @modelcontextprotocol/server-filesystem
2. @modelcontextprotocol/server-github
3. @modelcontextprotocol/server-postgres
4. @modelcontextprotocol/server-slack
5. @modelcontextprotocol/server-google-maps
6. @modelcontextprotocol/server-fetch
7. @modelcontextprotocol/server-memory
8. @modelcontextprotocol/server-puppeteer
9. @modelcontextprotocol/server-brave-search
10. @modelcontextprotocol/server-sqlite
11. Любые 10 community-серверов из реестра с 50+ stars

### Таблица результатов (заполнить)

| # | Сервер | Stars | Клонируется | npm install | Build | Запускается | list_tools | Tool call | Время на всё |
|---|--------|-------|-------------|-------------|-------|-------------|------------|-----------|--------------|
| 1 | ... | ... | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | ✅/❌ | X мин |

### Записать типичные ошибки
- Какие ошибки встречаются чаще всего?
- Где серверы ломаются?
- Сколько времени уходит на debug?

---

## Шаг 2: Написать пост (2-3 часа)

### Формат
Заголовок: "I tested the top 20 MCP servers. Here's what I found."

### Структура поста
1. **Hook**: "MCP has 10,000+ servers. But how many actually work?"
2. **Метод**: "I cloned, built, and tested the top 20 servers manually"
3. **Результаты**: таблица (красиво оформленная)
4. **Статистика**: X из 20 не собираются, Y из 20 не запускаются, Z из 20 list_tools не работает
5. **Типичные ошибки**: топ-5 проблем
6. **Вывод**: "We need automated testing for MCP. I'm building mcpkit — an open-source test framework. Join the waitlist."
7. **CTA**: ссылка на waitlist (простой Google Form или Typeform)

### Где публиковать
1. Hacker News (Show HN)
2. Twitter/X (тред)
3. Reddit r/LocalLLaMA, r/ChatGPT, r/programming
4. Dev.to

---

## Шаг 3: Waitlist (30 минут)

### Создать
- Google Form: имя, email, "Сколько MCP-серверов используете?", "Что бы хотели в тест-фреймворке?"
- Или Typeform / Tally (красивее)

---

## Шаг 4: Оценка (через 48-72 часа после поста)

### Метрики успеха

| Метрика | Провал | Нормально | Отлично |
|---------|--------|-----------|---------|
| HN upvotes | <10 | 30-100 | 100+ |
| Waitlist signups | <20 | 50-100 | 200+ |
| Twitter impressions | <1K | 5K-20K | 50K+ |
| "Shut up and take my money" comments | 0 | 1-3 | 5+ |
| "I'd pay for this" signals | 0 | 2-5 | 10+ |

### Решение
- **Провал**: пересмотреть идею. Может рынок не готов.
- **Нормально**: начать Phase 1 с осторожностью.
- **Отлично**: бросать всё и кодить Phase 1 сегодня.

---

## Результат Phase 0
- [ ] Таблица тестирования 20 серверов
- [ ] Пост опубликован на HN + Twitter
- [ ] Waitlist создан
- [ ] Через 72 часа — решение go/no-go
