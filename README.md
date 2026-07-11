# AI Content Assistant TMA

Frontend-only demo Telegram Mini App для авторов Telegram-каналов. Приложение показывает управляемый путь от brief до проверенного черновика и локального контент-плана.

Первый экран — рабочий интерфейс приложения, не лендинг.

## Функции

- Mobile-first app shell под Telegram Mini App, safe-area и Telegram theme params.
- Сценарии генерации: идеи постов, написать пост, переписать текст, контент-план на неделю, hooks/CTA.
- Форма: тема, аудитория, тон, цель, длина/формат, исходный текст для рерайта.
- Результат: 2-3 полезных русскоязычных варианта.
- Честная симуляция генерации: loading, тестируемая ошибка через `?generation=error`, retry и явные ограничения AI.
- Выбор варианта, редактируемый черновик, команды `короче / проще / экспертнее / продающее` и история версий.
- Реальный компонент Telegram-preview без отправки и без поддельных метрик.
- Обязательное human approval перед сохранением в локальный календарь.
- История генераций с поиском.
- Контент-план на неделю со статусами `draft`, `ready`, `posted`.
- Настройки канала: ниша, аудитория, tone of voice и стоп-слова.
- Демо-режим работает без backend и без платных внешних API.
- Данные сохраняются в `localStorage`, поэтому demo ведет себя как живое приложение.

## Запуск

```bash
npm install
npm run dev
```

Проверка production-сборки:

```bash
npm run build
```

Опционально:

```bash
npm run lint
npm run preview
```

## Деплой на dev-server

Публичный host для демо: `https://tma-content-assistant.ivantereshin-test.store`.

Контейнерная сборка уже подготовлена:

```bash
docker compose up -d --build
```

Контейнер публикует статическую frontend-сборку. Endpoint `GET /healthz` возвращает `200 ok`.

## Demo Flow

1. Открыть главный экран.
2. Выбрать сценарий, например `Написать пост`.
3. Отредактировать тему, аудиторию, тон и цель.
4. Нажать `Сгенерировать варианты`.
5. Выбрать вариант и открыть его в редакторе.
6. Применить команду, проверить историю версий и Telegram-preview.
7. Явно одобрить текст человеком и сохранить его в демо-календарь.
8. Перейти в `История` или `План` и проверить сохранённые данные.

## Assets

Подготовлены места для изображений:

- `public/assets/ai-workspace.png`
- `public/assets/ai-brand-card.png`

Если файлов нет, UI показывает CSS fallback без битых картинок. Позже можно просто добавить PNG с такими именами.

## Production Notes

- Сейчас это frontend-only demo: React + Vite + TypeScript.
- Моковый генератор лежит в `src/generator.ts`.
- Демо-данные лежат в `src/data.ts`.
- Persist state реализован через `src/storage.ts`.
- Для реального Telegram Mini App нужно подключить `window.Telegram.WebApp`, валидацию `initData` на backend и bot API для настоящей отправки сообщений.
- Для production backend лучше вынести генерацию, историю, drafts, calendar и usage accounting на сервер.
- В демо нет реальной AI-модели, отправки в Telegram, оплаты или backend API.

## AI Provider Notes

В demo не используются внешние платные API. Для production можно заменить `createGeneration` и `transformDraft` на вызовы AI-провайдера:

- отправлять на backend `scenario`, `brand profile`, `form input`;
- валидировать пользователя через Telegram `initData`;
- логировать usage на сервере без раскрытия исходных данных другим пользователям;
- возвращать 2-3 варианта ответа в том же формате, который сейчас использует UI.
