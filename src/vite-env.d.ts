/// <reference types="vite/client" />

interface TelegramWebApp {
  initData?: string;
  openInvoice?: (url: string, callback?: (status: string) => void) => void;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
  SettingsButton?: {
    show?: () => void;
    hide?: () => void;
    onClick?: (callback: () => void) => void;
    offClick?: (callback: () => void) => void;
  };
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}
