import type { LucideIcon } from 'lucide-react';

export type ScenarioId = 'ideas' | 'post' | 'rewrite' | 'plan' | 'hooks';
export type Tone = 'calm' | 'expert' | 'friendly' | 'bold' | 'sales';
export type CalendarStatus = 'draft' | 'ready' | 'posted';
export type TabId = 'home' | 'history' | 'editor' | 'calendar' | 'settings';
export type AiCommand = 'shorter' | 'simpler' | 'expert' | 'selling';

export interface Scenario {
  id: ScenarioId;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface BrandSettings {
  niche: string;
  audience: string;
  tone: Tone;
  stopWords: string;
  credits: number;
}

export interface GeneratorForm {
  topic: string;
  audience: string;
  tone: Tone;
  goal: string;
  length: string;
  sourceText: string;
}

export interface Generation {
  id: string;
  scenarioId: ScenarioId;
  scenarioTitle: string;
  topic: string;
  createdAt: string;
  variants: string[];
  saved: boolean;
}

export interface Draft {
  id: string;
  title: string;
  content: string;
  status: CalendarStatus;
  updatedAt: string;
}

export interface CalendarItem {
  id: string;
  day: string;
  dateLabel: string;
  title: string;
  channel: string;
  status: CalendarStatus;
  hook: string;
}

export interface ToastState {
  message: string;
  tone: 'success' | 'info';
}
