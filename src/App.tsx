import { useMemo, useState } from 'react';
import { Bot, Check, ChevronRight, Clock3, WandSparkles } from 'lucide-react';
import {
  AppHeader,
  BottomNav,
  EmptyState,
  ResultActions,
  StatusBadge,
  Toast,
  VisualAsset,
} from './components';
import { defaultBrand, defaultForm, scenarios, seedCalendar, seedDrafts, toneLabels } from './data';
import { createGeneration, transformDraft } from './generator';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [activeScenario, setActiveScenario] = useState<ScenarioId>('post');
  const [form, setForm] = useState<GeneratorForm>(defaultForm);
  const [brand, setBrand] = useLocalStorageState<BrandSettings>('aca-brand', defaultBrand);
  const [history, setHistory] = useLocalStorageState<Generation[]>('aca-history', []);
  const [drafts, setDrafts] = useLocalStorageState<Draft[]>('aca-drafts', seedDrafts);
  const [calendar, setCalendar] = useLocalStorageState<CalendarItem[]>('aca-calendar', seedCalendar);
  const [latestGeneration, setLatestGeneration] = useState<Generation | null>(null);
  const [activeDraftId, setActiveDraftId] = useState(seedDrafts[0]?.id ?? '');
  const [historyQuery, setHistoryQuery] = useState('');
  const [toast, setToast] = useState<ToastState | null>(null);

  const activeDraft = drafts.find((draft) => draft.id === activeDraftId) ?? drafts[0];
  const selectedScenario = scenarios.find((scenario) => scenario.id === activeScenario) ?? scenarios[1];

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

  function runGeneration() {
    const generation = createGeneration(activeScenario, form, brand);
    setLatestGeneration(generation);
    setHistory((current) => [generation, ...current].slice(0, 24));
    setBrand((current) => ({ ...current, credits: Math.max(current.credits - 3, 0) }));
    showToast('Готово: добавил варианты в историю');
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
    setActiveDraftId(draft.id);
    setActiveTab('editor');
    showToast('Сохранено в черновики');
  }

  function simulateSend(text: string) {
    const title = text.split('\n')[0].replace(/[:#]/g, '').slice(0, 56) || 'Пост из AI Assistant';
    const nextItem: CalendarItem = {
      id: crypto.randomUUID(),
      day: 'Сегодня',
      dateLabel: 'Через 15 мин',
      title,
      channel: '@founder_notes',
      status: 'ready',
      hook: text.split('\n').find((line) => line.length > 20)?.slice(0, 110) ?? title,
    };
    setCalendar((current) => [nextItem, ...current]);
    showToast('Имитация: пост поставлен в очередь Telegram', 'info');
  }

  function applyAiCommand(command: AiCommand) {
    if (!activeDraft) {
      return;
    }

    const transformed = transformDraft(command, activeDraft.content);
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
      <main className="app-shell">
        <AppHeader credits={brand.credits} />

        {activeTab === 'home' && (
          <section className="screen-stack" aria-label="Главная">
            <div className="workspace-grid">
              <VisualAsset
                src="/assets/ai-workspace.png"
                title="AI workspace"
                text="Здесь можно заменить картинку на public/assets/ai-workspace.png"
              />
              <div className="summary-panel">
                <div className="summary-top">
                  <Bot size={20} />
                  <span>{toneLabels[brand.tone]}</span>
                </div>
                <strong>{brand.niche}</strong>
                <p>{brand.audience}</p>
              </div>
            </div>

            <section className="scenario-strip" aria-label="Сценарии генерации">
              {scenarios.map((scenario, index) => {
                const Icon = scenario.icon;
                const isActive = scenario.id === activeScenario && scenario.title === selectedScenario.title;

                return (
                  <button
                    key={`${scenario.title}-${index}`}
                    className={`scenario-card ${isActive ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setActiveScenario(scenario.id)}
                  >
                    <Icon size={19} />
                    <span>{scenario.title}</span>
                    <small>{scenario.description}</small>
                  </button>
                );
              })}
            </section>

            <section className="panel generation-panel">
              <div className="section-heading">
                <div>
                  <p className="muted-label">Сценарий</p>
                  <h2>{selectedScenario.title}</h2>
                </div>
                <button className="small-link" type="button" onClick={() => setActiveTab('settings')}>
                  Бренд
                  <ChevronRight size={15} />
                </button>
              </div>

              <label className="field">
                <span>Тема</span>
                <textarea
                  value={form.topic}
                  onChange={(event) => updateForm('topic', event.target.value)}
                  rows={3}
                />
              </label>

              <label className="field">
                <span>Аудитория</span>
                <textarea
                  value={form.audience}
                  onChange={(event) => updateForm('audience', event.target.value)}
                  rows={2}
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

              <button className="primary-button" type="button" onClick={runGeneration}>
                <WandSparkles size={18} />
                Сгенерировать варианты
              </button>
            </section>

            <section className="results-list" aria-label="Результаты">
              {!latestGeneration && (
                <EmptyState>Выберите сценарий и нажмите генерацию. Результаты появятся здесь.</EmptyState>
              )}
              {latestGeneration?.variants.map((variant, index) => (
                <article className="result-card" key={`${latestGeneration.id}-${index}`}>
                  <div className="result-card-head">
                    <span>Вариант {index + 1}</span>
                    <Check size={16} />
                  </div>
                  <p>{variant}</p>
                  <ResultActions
                    onCopy={() => void copyText(variant)}
                    onSave={() => saveAsDraft(variant)}
                    onSend={() => simulateSend(variant)}
                  />
                </article>
              ))}
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
              <section className="panel editor-panel">
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
            <VisualAsset
              src="/assets/ai-brand-card.png"
              title="Brand card"
              text="Здесь можно заменить картинку на public/assets/ai-brand-card.png"
            />
            <section className="panel settings-panel">
              <div className="section-heading">
                <div>
                  <p className="muted-label">Профиль</p>
                  <h2>Настройки бренда</h2>
                </div>
                <span className="credit-pill">{brand.credits} credits</span>
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
            </section>
          </section>
        )}
      </main>

      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      <Toast toast={toast} />
    </div>
  );
}
