import { useState, type ReactNode } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  Clipboard,
  Home,
  History,
  Image as ImageIcon,
  MessageCircle,
  Save,
  Settings,
  Sparkles,
} from 'lucide-react';
import type { CalendarStatus, TabId, ToastState } from './types';

const statusLabels: Record<CalendarStatus, string> = {
  draft: 'draft',
  ready: 'ready',
  posted: 'posted',
};

const tabIcons: Record<TabId, ReactNode> = {
  home: <Home size={20} />,
  history: <History size={20} />,
  editor: <Sparkles size={20} />,
  calendar: <CalendarDays size={20} />,
  settings: <Settings size={20} />,
};

const tabLabels: Record<TabId, string> = {
  home: 'Главная',
  history: 'История',
  editor: 'Редактор',
  calendar: 'План',
  settings: 'Бренд',
};

export function AppHeader({ credits }: { credits: number }) {
  return (
    <header className="app-header">
      <div>
        <p className="muted-label">Telegram Mini App</p>
        <h1>AI Content Assistant</h1>
      </div>
      <div className="credit-pill">
        <Sparkles size={15} />
        {credits}
      </div>
    </header>
  );
}

export function VisualAsset({ src, title, text }: { src: string; title: string; text: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`visual-card ${failed ? 'has-fallback' : ''}`}>
      {!failed && <img src={src} alt="" onError={() => setFailed(true)} />}
      {failed && (
        <div className="visual-fallback" aria-hidden="true">
          <ImageIcon size={22} />
          <span>{title}</span>
          <small>{text}</small>
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status }: { status: CalendarStatus }) {
  return <span className={`status status-${status}`}>{statusLabels[status]}</span>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="empty-state">
      <Sparkles size={20} />
      <p>{children}</p>
    </div>
  );
}

export function ResultActions({
  onCopy,
  onSave,
  onSend,
}: {
  onCopy: () => void;
  onSave: () => void;
  onSend: () => void;
}) {
  return (
    <div className="result-actions">
      <button className="icon-button" type="button" onClick={onCopy} aria-label="Скопировать">
        <Clipboard size={17} />
      </button>
      <button className="icon-button" type="button" onClick={onSave} aria-label="Сохранить">
        <Save size={17} />
      </button>
      <button className="ghost-button" type="button" onClick={onSend}>
        <MessageCircle size={16} />
        В чат
      </button>
    </div>
  );
}

export function BottomNav({
  activeTab,
  onChange,
}: {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
}) {
  const tabs: TabId[] = ['home', 'history', 'editor', 'calendar', 'settings'];

  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {tabs.map((tab) => (
        <button
          key={tab}
          className={activeTab === tab ? 'is-active' : ''}
          type="button"
          onClick={() => onChange(tab)}
        >
          {tabIcons[tab]}
          <span>{tabLabels[tab]}</span>
        </button>
      ))}
    </nav>
  );
}

export function Toast({ toast }: { toast: ToastState | null }) {
  if (!toast) {
    return null;
  }

  return (
    <div className={`toast toast-${toast.tone}`}>
      <CheckCircle2 size={17} />
      {toast.message}
    </div>
  );
}
