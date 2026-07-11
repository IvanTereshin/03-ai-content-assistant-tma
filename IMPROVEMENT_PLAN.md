# Improvement plan: AI Content Assistant TMA

Основано на `CUSTOMER_REVIEW.md`. Цель - превратить форму генерации в рабочую studio для автора Telegram-канала.

## Целевое направление

Ниша: creator content studio.  
Визуальный стиль: warm newsprint, ink, fluorescent coral accent, condensed editorial typography.  
Главное ощущение: автор управляет контентом, а не просто нажимает кнопку генерации.

## Фаза 1. Дизайн-система

- Уйти от Telegram-blue в отдельный creator OS стиль.
- Пересобрать главный экран как studio: контекст канала, editor, Telegram post preview.
- Сценарии генерации заменить на presets с понятным результатом.
- Сделать результаты как сравнимые варианты: short, expert, sales, community.
- Бренд-профиль поднять выше, чтобы он был видимым источником генерации.
- Контент-план заменить на календарь или kanban.
- Историю версий показать как рабочий инструмент, а не архив.

## Фаза 2. Функционал

- Добавить quality score: тон, длина, конкретность, риск клише.
- Добавить inline-редактор: выделить фрагмент и применить команду.
- Добавить сохраненные brand voices для нескольких каналов.
- Добавить историю версий черновика.
- Добавить anti-cliche подсветку слабых фраз.
- Добавить copy/export с сохранением форматирования.
- Добавить credits ledger: сколько списано и за какое действие.

## GSAP-анимации

Добавить зависимости:

```bash
npm install gsap @gsap/react
```

Где применить:

- Studio entry: editor, preview и brand context появляются как stagger-панели.
- Generation state: skeleton результата заполняется прогрессивно, затем текст появляется word-by-word reveal.
- Variant comparison: при переключении варианта карточка не прыгает, а мягко меняет высоту через `height: auto` animation.
- Inline command: выделенный фрагмент получает короткий highlight sweep после применения команды.
- Content calendar: карточки публикаций мягко перемещаются между статусами.
- Credits update: число credits меняется через короткий counter animation.

Ограничения:

- Не имитировать настоящую AI-генерацию слишком долгой анимацией.
- Не использовать постоянные shimmer-эффекты после загрузки.
- Для больших текстов анимировать блоки, а не каждую букву, чтобы не просадить FPS.

## Технические шаги

- Создать `src/motion/contentMotion.ts`.
- Разделить экраны: `StudioLayout`, `ChannelContext`, `PromptPresets`, `EditorPanel`, `TelegramPreview`, `VariantList`, `ContentCalendar`, `BrandVoicePanel`.
- Добавить структуру данных для versions, scores, highlighted phrases.
- Добавить reduced motion guard.
- Добавить тестовый сценарий: generate -> edit -> save -> calendar -> history.

## Критерии готовности

- Первый экран выглядит как studio, а не анкета.
- Результаты можно сравнить и улучшить.
- Telegram preview выглядит убедительно.
- Анимации помогают понять генерацию, правку и сохранение.
- Визуальный стиль отличается от остальных TMA.
