import { useEffect, useMemo, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import { Check, ChevronRight, Clock3, ShieldCheck, WandSparkles } from 'lucide-react';
import {
  AppHeader,
  BottomNav,
  EmptyState,
  ResultActions,
  StatusBadge,
  Toast,
} from './components';
import { defaultBrand, defaultForm, scenarios, seedCalendar, seedDrafts, toneLabels } from './data';
import { createGeneration, transformDraft } from './generator';
import { playResultReveal, playStudioEntry } from './motion/contentMotion';
import { useLocalStorageState } from './storage';
import type {
  AiCommand,
  BrandSettings,
  CalendarItem,
  CalendarStatus,
  Draft,
  Generation,
  GeneratorForm,
  ScenarioId,
  TabId,
  ToastState,
  Tone,
} from './types';

const aiCommands: { id: AiCommand; title: string }[] = [
  { id: 'shorter', title: 'Короче' },
  { id: 'simpler', title: 'Проще' },
  { id: 'expert', title: 'Экспертнее' },
  { id: 'selling', title: 'Продающее' },
];

const calendarStatusFlow: Record<CalendarStatus, CalendarStatus> = {
  draft: 'ready',
  ready: 'posted',
  posted: 'draft',
};

const variantProfiles = [
  {
    title: 'Expert',
    note: 'больше позиции и аргументов',
  },
  {
    title: 'Short',
    note: 'быстрее читается в ленте',
  },
  {
    title: 'Sales',
    note: 'сильнее ведет к действию',
  },
];

function getClicheHits(text: string, stopWords: string): string[] {
  const source = text.toLowerCase();
  const defaultWords = ['уникальный', 'инновационный', 'революционный', 'лучший на рынке'];
  const customWords = stopWords
    .split(',')
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean);

  return [...defaultWords, ...customWords].filter((word, index, list) => list.indexOf(word) === index && source.includes(word));
}

function getQualityScore(text: string, stopWords: string) {
  const clicheHits = getClicheHits(text, stopWords);
  const hasStructure = /cta|хук|пн|вт|1\.|-/i.test(text);
  const hasNumbers = /\d/.test(text);
  const hasAudience = /читател|автор|канал|аудитори/i.test(text);
  const lengthScore = text.length > 260 && text.length < 1700 ? 88 : 74;
  const tone = Math.max(58, 86 - clicheHits.length * 7 + (hasAudience ? 5 : 0));
  const structure = hasStructure ? 91 : 73;
  const concrete = Math.min(94, 72 + (hasNumbers ? 10 : 0) + (hasAudience ? 8 : 0));
  const clicheRisk = Math.min(92, 18 + clicheHits.length * 18);
  const overall = Math.round((tone + structure + concrete + lengthScore + (100 - clicheRisk)) / 5);

  return { clicheHits, clicheRisk, concrete, lengthScore, overall, structure, tone };
}

function getPreviewText(generation: Generation | null, variantIndex: number, form: GeneratorForm): string {
  const variant = generation?.variants[variantIndex];

  if (variant) {
    return variant;
  }

  return `Хук: ${form.topic}\n\nГлавная мысль: регулярный контент держится на системе тем, черновиков и проверки перед публикацией.\n\nCTA: сохраните идею и превратите ее в ближайший пост.`;
}

function TelegramPostPreview({ text }: { text: string }) {
  const previewLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 6);

  return (
    <aside className="telegram-preview" data-studio-motion aria-label="Preview Telegram-поста">
      <div className="telegram-preview-head">
        <span className="channel-avatar">FN</span>
        <div>
          <strong>@founder_notes</strong>
          <small>preview публикации</small>
        </div>
      </div>
      <div className="telegram-post">
        {previewLines.map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
      </div>
      <div className="telegram-reactions">
        <span>Предпросмотр · без отправки</span>
      </div>
    </aside>
  );
}

export default function App() {
  const shellRef = useRef<HTMLElement | null>(null);
  const resultsRef = useRef<HTMLElement | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('post');
  const [form, setForm] = useState<GeneratorForm>(defaultForm);
  const [brand, setBrand] = useLocalStorageState<BrandSettings>('aca-brand', defaultBrand);
  const [history, setHistory] = useLocalStorageState<Generation[]>('aca-history', []);
  const [drafts, setDrafts] = useLocalStorageState<Draft[]>('aca-drafts', seedDrafts);
  const [calendar, setCalendar] = useLocalStorageState<CalendarItem[]>('aca-calendar', seedCalendar);
  const [draftVersions, setDraftVersions] = useLocalStorageState<Record<string, string[]>>('aca-versions-v2', {});
  const [approvedDraftIds, setApprovedDraftIds] = useLocalStorageState<string[]>('aca-approved-v2', []);
  const [latestGeneration, setLatestGeneration] = useState<Generation | null>(null);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [generationState, setGenerationState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [activeDraftId, setActiveDraftId] = useState(seedDrafts[0]?.id ?? '');
  const [historyQuery, setHistoryQuery] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  const activeDraft = drafts.find((draft) => draft.id === activeDraftId) ?? drafts[0];
  const selectedScenario = scenarios.find((scenario) => scenario.id === activeScenario) ?? scenarios[1];
  const previewText = getPreviewText(latestGeneration, activeVariantIndex, form);
  const qualityScore = getQualityScore(previewText, brand.stopWords);
  const activeVariantProfile = variantProfiles[activeVariantIndex] ?? variantProfiles[0];

  useEffect(() => {
    const settingsButton = window.Telegram?.WebApp?.SettingsButton;
    if (!settingsButton?.show) {
      return undefined;
    }

    const openSettings = () => setActiveTab('settings');
    settingsButton.show();
    settingsButton.onClick?.(openSettings);

    return () => {
      settingsButton.offClick?.(openSettings);
    };
  }, []);

  useGSAP(
    () => {
      if (activeTab === 'home') {
        playStudioEntry(shellRef.current);
      }
    },
    { dependencies: [activeTab] },
  );

  useGSAP(
    () => {
      playResultReveal(resultsRef.current);
    },
    { dependencies: [latestGeneration?.id] },
  );

  const filteredHistory = useMemo(() => {
    const query = historyQuery.trim().toLowerCase();

    if (!query) {
      return history;
    }

    return history.filter((item) => {
      const haystack = [item.scenarioTitle, item.topic, ...item.variants].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }, [history, historyQuery]);

  function showToast(message: string, tone: ToastState['tone'] = 'success') {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 2200);
  }

  function updateForm<Key extends keyof GeneratorForm>(key: Key, value: GeneratorForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function runGeneration(retry = false) {
    setGenerationState('loading');
    window.setTimeout(() => {
      const shouldFail = new URLSearchParams(window.location.search).get('generation') === 'error' && !retry;
      if (shouldFail) {
        setGenerationState('error');
        return;
      }
      const generation = createGeneration(activeScenario, form, brand);
      setLatestGeneration(generation);
      setActiveVariantIndex(0);
      setHistory((current) => [generation, ...current].slice(0, 24));
      setGenerationState('idle');
      showToast('Демо-варианты готовы. Проверьте факты и формулировки.');
    }, 640);
  }

  async function copyText(text: string) {
    await navigator.clipboard?.writeText(text);
    showToast('Скопировано в буфер');
  }

  function saveAsDraft(text: string, title = form.topic) {
    const draft: Draft = {
      id: crypto.randomUUID(),
      title: title.slice(0, 68),
      content: text,
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };
    setDrafts((current) => [draft, ...current]);
    setDraftVersions((current) => ({ ...current, [draft.id]: [text] }));
    setActiveDraftId(draft.id);
    setActiveTab('editor');
    showToast('Сохранено в черновики');
  }

  function scheduleDraft(text: string, title = 'Пост после проверки') {
    const calendarTitle = title.trim().slice(0, 56) || text.split('\n')[0].replace(/[:#]/g, '').slice(0, 56) || 'Пост после проверки';
    const nextItem: CalendarItem = {
      id: crypto.randomUUID(),
      day: 'Сегодня',
      dateLabel: 'Через 15 мин',
      title: calendarTitle,
      channel: '@founder_notes',
      status: 'ready',
      hook: text.split('\n').find((line) => line.length > 20)?.slice(0, 110) ?? calendarTitle,
    };
    setCalendar((current) => [nextItem, ...current]);
    showToast('Сохранено в локальный демо-календарь. В Telegram ничего не отправлено.', 'info');
  }

  function applyAiCommand(command: AiCommand) {
    if (!activeDraft) {
      return;
    }

    const transformed = transformDraft(command, activeDraft.content);
    setDraftVersions((current) => ({
      ...current,
      [activeDraft.id]: [...(current[activeDraft.id] ?? [activeDraft.content]), transformed].slice(-8),
    }));
    setApprovedDraftIds((current) => current.filter((id) => id !== activeDraft.id));
    setDrafts((current) =>
      current.map((draft) =>
        draft.id === activeDraft.id
          ? { ...draft, content: transformed, updatedAt: new Date().toISOString() }
          : draft,
      ),
    );
    showToast('AI-команда применена');
  }

  function updateActiveDraft(content: string) {
    if (!activeDraft) {
      return;
    }

    setDrafts((current) =>
      current.map((draft) =>
        draft.id === activeDraft.id ? { ...draft, content, updatedAt: new Date().toISOString() } : draft,
      ),
    );
    setApprovedDraftIds((current) => current.filter((id) => id !== activeDraft.id));
  }

  function createBlankDraft() {
    const draft: Draft = {
      id: crypto.randomUUID(),
      title: 'Новый черновик',
      content: 'Хук: \n\nОсновная мысль: \n\nCTA: ',
      status: 'draft',
      updatedAt: new Date().toISOString(),
    };
    setDrafts((current) => [draft, ...current]);
    setDraftVersions((current) => ({ ...current, [draft.id]: [draft.content] }));
    setActiveDraftId(draft.id);
    setActiveTab('editor');
  }

  function cycleCalendarStatus(id: string) {
    setCalendar((current) =>
      current.map((item) =>
        item.id === id ? { ...item, status: calendarStatusFlow[item.status] } : item,
      ),
    );
  }

  return (
    <div className="telegram-page">
      <main className="app-shell" ref={shellRef}>
        <a className="skip-link" href="#workspace">Перейти к рабочей области</a>
        <AppHeader />

        {activeTab === 'home' && (
          <section className="studio-screen" id="workspace" tabIndex={-1} aria-label="Студия автора">
            <section className="studio-hero">
              <div className="channel-context" data-studio-motion>
                <div className="context-topline">
                  <span className="channel-avatar">FN</span>
                  <div>
                    <p className="muted-label">Brand voice</p>
                    <h2>{brand.niche}</h2>
                  </div>
                </div>
                <p>{brand.audience}</p>
                <div className="brand-tags">
                  <span>{toneLabels[brand.tone]}</span>
                  {brand.stopWords
                    .split(',')
                    .map((word) => word.trim())
                    .filter(Boolean)
                    .slice(0, 3)
                    .map((word) => (
                      <span key={word}>{word}</span>
                    ))}
                </div>
                <div className="credits-ledger">
                  <span>Режим</span>
                  <strong>DEMO</strong>
                  <small>локальная симуляция</small>
                </div>
                <button className="small-link" type="button" onClick={() => setActiveTab('settings')}>
                  Бренд
                  <ChevronRight size={15} />
                </button>
              </div>

              <TelegramPostPreview text={previewText} />
            </section>

            <section className="preset-rail" data-studio-motion aria-label="Presets генерации">
              {scenarios.map((scenario, index) => {
                const Icon = scenario.icon;
                const isActive = scenario.id === activeScenario && scenario.title === selectedScenario.title;

                return (
                  <button
                    key={`${scenario.title}-${index}`}
                    className={`preset-card ${isActive ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setActiveScenario(scenario.id)}
                  >
                    <Icon size={18} />
                    <span>{scenario.title}</span>
                    <small>{scenario.description}</small>
                  </button>
                );
              })}
            </section>

            <section className="studio-composer" data-studio-motion>
              <div className="section-heading">
                <div>
                  <p className="muted-label">Editor studio</p>
                  <h2>{selectedScenario.title}</h2>
                </div>
                <span className="studio-mode">{activeVariantProfile.title}</span>
              </div>

              <label className="field">
                <span>Тема</span>
                <textarea
                  value={form.topic}
                  onChange={(event) => updateForm('topic', event.target.value)}
                  rows={3}
                />
              </label>

              <div className="form-row">
                <label className="field">
                  <span>Тон</span>
                  <select
                    value={form.tone}
                    onChange={(event) => updateForm('tone', event.target.value as Tone)}
                  >
                    {Object.entries(toneLabels).map(([tone, label]) => (
                      <option key={tone} value={tone}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Формат</span>
                  <select value={form.length} onChange={(event) => updateForm('length', event.target.value)}>
                    <option>Короткий пост до 800 знаков</option>
                    <option>Средний пост 1200-1800 знаков</option>
                    <option>Длинный экспертный пост</option>
                    <option>Список идей</option>
                  </select>
                </label>
              </div>

              <label className="field">
                <span>Цель</span>
                <textarea
                  value={form.goal}
                  onChange={(event) => updateForm('goal', event.target.value)}
                  rows={2}
                />
              </label>

              {activeScenario === 'rewrite' && (
                <label className="field">
                  <span>Исходный текст</span>
                  <textarea
                    value={form.sourceText}
                    onChange={(event) => updateForm('sourceText', event.target.value)}
                    rows={5}
                  />
                </label>
              )}

              <div className="quality-grid" aria-label="Оценка качества">
                <div>
                  <span>Score</span>
                  <strong>{qualityScore.overall}</strong>
                </div>
                <div>
                  <span>Тон</span>
                  <strong>{qualityScore.tone}</strong>
                </div>
                <div>
                  <span>Конкретика</span>
                  <strong>{qualityScore.concrete}</strong>
                </div>
                <div>
                  <span>Клише</span>
                  <strong>{qualityScore.clicheRisk}%</strong>
                </div>
              </div>

              <div className="cliche-row">
                <ShieldCheck size={16} />
                <span>
                  {qualityScore.clicheHits.length > 0
                    ? `Проверить: ${qualityScore.clicheHits.join(', ')}`
                    : 'Анти-клише фильтр: чисто'}
                </span>
              </div>

              <p className="ai-limitation">AI-ограничение: это локально собранные демо-варианты. Проверьте факты, тон и обещания перед публикацией.</p>
              <button className="primary-button" type="button" disabled={generationState === 'loading'} onClick={() => runGeneration(false)}>
                <WandSparkles size={18} />
                {generationState === 'loading' ? 'Собираем варианты…' : 'Сгенерировать демо-варианты'}
              </button>
            </section>

            <section className="variant-workbench" ref={resultsRef} data-studio-motion aria-label="Результаты">
              <div className="section-heading">
                <div>
                  <p className="muted-label">Variant board</p>
                  <h2>Сравнение результата</h2>
                </div>
                <span className="count-pill">{latestGeneration?.variants.length ?? 0}</span>
              </div>
              {generationState === 'loading' && <div className="generation-loading" role="status" aria-live="polite">Анализируем brief и brand voice…</div>}
              {generationState === 'error' && <div className="generation-error" role="alert"><strong>Не удалось собрать варианты</strong><span>Это тестируемое демо-состояние. Brief сохранён.</span><button type="button" onClick={() => runGeneration(true)}>Повторить</button></div>}
              {!latestGeneration && generationState === 'idle' && (
                <EmptyState>Готовые версии, оценка и preview появятся в этом рабочем поле.</EmptyState>
              )}
              {latestGeneration?.variants.map((variant, index) => {
                const profile = variantProfiles[index] ?? variantProfiles[0];
                const score = getQualityScore(variant, brand.stopWords);
                const isActive = activeVariantIndex === index;

                return (
                  <article
                    className={`variant-card ${isActive ? 'is-active' : ''}`}
                    data-result-motion
                    key={`${latestGeneration.id}-${index}`}
                  >
                    <div className="variant-card-head">
                      <button className="variant-selector" type="button" onClick={() => setActiveVariantIndex(index)}>
                        <span>{profile.title}</span>
                        <small>{profile.note}</small>
                      </button>
                      <div className="score-badge">
                        <Check size={15} />
                        {score.overall}
                      </div>
                    </div>
                    <div className="variant-metrics">
                      <span>Тон {score.tone}</span>
                      <span>Структура {score.structure}</span>
                      <span>Клише {score.clicheRisk}%</span>
                    </div>
                    <p className="variant-text">{variant}</p>
                    <ResultActions
                      onCopy={() => void copyText(variant)}
                      onSave={() => saveAsDraft(variant)}
                      onSend={() => saveAsDraft(variant)}
                    />
                  </article>
                );
              })}
            </section>
          </section>
        )}

        {activeTab === 'history' && (
          <section className="screen-stack">
            <div className="section-heading">
              <div>
                <p className="muted-label">Все генерации</p>
                <h2>История</h2>
              </div>
              <span className="count-pill">{history.length}</span>
            </div>
            <input
              className="search-input"
              value={historyQuery}
              onChange={(event) => setHistoryQuery(event.target.value)}
              placeholder="Поиск по теме, сценарию или тексту"
            />
            <div className="history-list">
              {filteredHistory.length === 0 && <EmptyState>История пока пустая или ничего не найдено.</EmptyState>}
              {filteredHistory.map((item) => (
                <article className="history-item" key={item.id}>
                  <div>
                    <span>{item.scenarioTitle}</span>
                    <strong>{item.topic}</strong>
                    <small>
                      <Clock3 size={13} />
                      {new Date(item.createdAt).toLocaleString('ru-RU', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </small>
                  </div>
                  <button type="button" onClick={() => saveAsDraft(item.variants[0], item.topic)}>
                    В черновик
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'editor' && (
          <section className="screen-stack">
            <div className="section-heading">
              <div>
                <p className="muted-label">Черновик</p>
                <h2>AI-редактор</h2>
              </div>
              <button className="small-link" type="button" onClick={createBlankDraft}>
                Новый
              </button>
            </div>

            <div className="draft-switcher">
              {drafts.map((draft) => (
                <button
                  key={draft.id}
                  className={draft.id === activeDraft?.id ? 'is-active' : ''}
                  type="button"
                  onClick={() => setActiveDraftId(draft.id)}
                >
                  {draft.title}
                </button>
              ))}
            </div>

            {activeDraft ? (
              <section className="editor-workspace">
                <div className="panel editor-panel">
                <div className="editor-meta">
                  <StatusBadge status={activeDraft.status} />
                  <span>
                    Обновлено{' '}
                    {new Date(activeDraft.updatedAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <textarea
                  className="draft-editor"
                  aria-label="Текст черновика"
                  value={activeDraft.content}
                  onChange={(event) => updateActiveDraft(event.target.value)}
                />
                <div className="command-grid">
                  {aiCommands.map((command) => (
                    <button key={command.id} type="button" onClick={() => applyAiCommand(command.id)}>
                      {command.title}
                    </button>
                  ))}
                </div>
                <section className="version-history" aria-label="История версий">
                  <strong>История версий</strong>
                  {(draftVersions[activeDraft.id] ?? [activeDraft.content]).map((version, index, list) => (
                    <button key={`${activeDraft.id}-${index}`} type="button" onClick={() => updateActiveDraft(version)}>
                      v{index + 1} · {index === list.length - 1 ? 'текущая команда' : 'сохранённая'}
                    </button>
                  ))}
                </section>
                </div>
                <div className="approval-column">
                  <TelegramPostPreview text={activeDraft.content} />
                  <section className="approval-gate">
                    <strong>Human approval</strong>
                    <p>Проверьте факты, ссылки, обещания и соответствие голосу канала. Симуляция не публикует пост.</p>
                    <button
                      className={approvedDraftIds.includes(activeDraft.id) ? 'approved' : ''}
                      type="button"
                      onClick={() => setApprovedDraftIds((current) => current.includes(activeDraft.id) ? current.filter((id) => id !== activeDraft.id) : [...current, activeDraft.id])}
                    >
                      {approvedDraftIds.includes(activeDraft.id) ? 'Одобрено человеком' : 'Одобрить после проверки'}
                    </button>
                    <button className="primary-button" type="button" disabled={!approvedDraftIds.includes(activeDraft.id)} onClick={() => scheduleDraft(activeDraft.content, activeDraft.title)}>
                      Сохранить в демо-календарь
                    </button>
                  </section>
                </div>
              </section>
            ) : (
              <EmptyState>Создайте первый черновик.</EmptyState>
            )}
          </section>
        )}

        {activeTab === 'calendar' && (
          <section className="screen-stack">
            <div className="section-heading">
              <div>
                <p className="muted-label">Публикации</p>
                <h2>Контент-план</h2>
              </div>
              <span className="count-pill">7 дней</span>
            </div>
            <div className="calendar-list">
              {calendar.map((item) => (
                <article className="calendar-card" key={item.id}>
                  <div className="date-box">
                    <strong>{item.day}</strong>
                    <span>{item.dateLabel}</span>
                  </div>
                  <div>
                    <div className="calendar-card-head">
                      <strong>{item.title}</strong>
                      <button type="button" onClick={() => cycleCalendarStatus(item.id)}>
                        <StatusBadge status={item.status} />
                      </button>
                    </div>
                    <p>{item.hook}</p>
                    <small>{item.channel}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <section className="screen-stack">
            <section className="panel settings-panel">
              <div className="section-heading">
                <div>
                  <p className="muted-label">Контекст канала</p>
                  <h2>Brand voice</h2>
                </div>
                <span className="credit-pill">LOCAL DEMO</span>
              </div>

              <label className="field">
                <span>Ниша</span>
                <input
                  value={brand.niche}
                  onChange={(event) => setBrand((current) => ({ ...current, niche: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Аудитория</span>
                <textarea
                  value={brand.audience}
                  onChange={(event) => setBrand((current) => ({ ...current, audience: event.target.value }))}
                  rows={3}
                />
              </label>
              <label className="field">
                <span>Tone of voice</span>
                <select
                  value={brand.tone}
                  onChange={(event) => setBrand((current) => ({ ...current, tone: event.target.value as Tone }))}
                >
                  {Object.entries(toneLabels).map(([tone, label]) => (
                    <option key={tone} value={tone}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Стоп-слова</span>
                <textarea
                  value={brand.stopWords}
                  onChange={(event) => setBrand((current) => ({ ...current, stopWords: event.target.value }))}
                  rows={3}
                />
              </label>

              <p className="ai-limitation">Настройки сохраняются только в localStorage этого браузера. Реальная AI-модель, Telegram-отправка и платёжный backend не подключены.</p>
            </section>
          </section>
        )}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      <Toast toast={toast} />
    </div>
  );
}
