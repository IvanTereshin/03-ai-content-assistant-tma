import {
  Calendar,
  Lightbulb,
  Megaphone,
  PencilLine,
  RefreshCcw,
} from 'lucide-react';
import type { BrandSettings, CalendarItem, Draft, GeneratorForm, Scenario } from './types';

export const scenarios: Scenario[] = [
  {
    id: 'ideas',
    title: 'Идеи постов',
    description: '10 тем под канал и аудиторию',
    icon: Lightbulb,
  },
  {
    id: 'post',
    title: 'Написать пост',
    description: 'Готовый текст с хуком и CTA',
    icon: PencilLine,
  },
  {
    id: 'rewrite',
    title: 'Переписать',
    description: 'Сделать текст яснее и сильнее',
    icon: RefreshCcw,
  },
  {
    id: 'plan',
    title: 'План на неделю',
    description: '7 публикаций по целям',
    icon: Calendar,
  },
  {
    id: 'hooks',
    title: 'Hooks / CTA',
    description: 'Зацепки и призывы к действию',
    icon: Megaphone,
  },
];

export const defaultBrand: BrandSettings = {
  niche: 'AI-инструменты для малого бизнеса',
  audience: 'основатели, маркетологи и продюсеры Telegram-каналов',
  tone: 'expert',
  stopWords: 'уникальный, инновационный, революционный, лучший на рынке',
  credits: 84,
};

export const defaultForm: GeneratorForm = {
  topic: 'Как владельцу канала стабильно выпускать сильные посты без выгорания',
  audience: defaultBrand.audience,
  tone: defaultBrand.tone,
  goal: 'получить сохранения и заявки на консультацию',
  length: 'Средний пост 1200-1800 знаков',
  sourceText:
    'Многие авторы пишут рывками: неделю активно, потом пропадают. Нужна система тем, черновиков и проверки перед публикацией.',
};

export const seedDrafts: Draft[] = [
  {
    id: 'draft-1',
    title: 'Система контента без выгорания',
    status: 'ready',
    updatedAt: new Date().toISOString(),
    content:
      'Стабильный канал держится не на вдохновении, а на простом процессе: банк идей, один день для черновиков, короткая проверка пользы и понятный CTA. Так автор не начинает каждый пост с пустого листа.',
  },
  {
    id: 'draft-2',
    title: '5 ошибок AI-постов',
    status: 'draft',
    updatedAt: new Date().toISOString(),
    content:
      'AI помогает писать быстрее, но текст разваливается, если нет задачи, аудитории и позиции автора. Начинайте не с промпта, а с ответа: что читатель должен понять или сделать после поста?',
  },
];

export const seedCalendar: CalendarItem[] = [
  {
    id: 'cal-1',
    day: 'Пн',
    dateLabel: '09:30',
    title: 'Банк идей для канала',
    channel: '@founder_notes',
    status: 'posted',
    hook: 'Если у вас нет банка идей, вы каждый раз платите вниманием заново.',
  },
  {
    id: 'cal-2',
    day: 'Вт',
    dateLabel: '12:00',
    title: 'Как оценить черновик',
    channel: '@founder_notes',
    status: 'ready',
    hook: 'Пост готов не тогда, когда он длинный, а когда его легко пересказать.',
  },
  {
    id: 'cal-3',
    day: 'Ср',
    dateLabel: '18:15',
    title: 'Разбор слабого CTA',
    channel: '@founder_notes',
    status: 'draft',
    hook: 'CTA не должен просить. Он должен объяснять следующий шаг.',
  },
  {
    id: 'cal-4',
    day: 'Чт',
    dateLabel: '10:00',
    title: 'Личный опыт внедрения AI',
    channel: '@founder_notes',
    status: 'draft',
    hook: 'AI не заменил редактора. Он забрал рутину между идеей и первым черновиком.',
  },
  {
    id: 'cal-5',
    day: 'Пт',
    dateLabel: '16:30',
    title: 'Подборка промптов недели',
    channel: '@founder_notes',
    status: 'ready',
    hook: 'Сохраните эти 4 промпта, если хотите писать быстрее без потери голоса.',
  },
  {
    id: 'cal-6',
    day: 'Сб',
    dateLabel: '11:45',
    title: 'Вопрос аудитории',
    channel: '@founder_notes',
    status: 'draft',
    hook: 'Что сложнее: придумать тему или довести текст до публикации?',
  },
  {
    id: 'cal-7',
    day: 'Вс',
    dateLabel: '19:00',
    title: 'Итоги недели',
    channel: '@founder_notes',
    status: 'draft',
    hook: 'Неделя показывает правду: где была система, а где только надежда на вдохновение.',
  },
];

export const toneLabels: Record<BrandSettings['tone'], string> = {
  calm: 'Спокойный',
  expert: 'Экспертный',
  friendly: 'Дружелюбный',
  bold: 'Смелый',
  sales: 'Продающий',
};
