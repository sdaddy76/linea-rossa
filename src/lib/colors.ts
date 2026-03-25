import type { ZonaColore } from '@/data/tracciati';

// Colori per ogni zona del tracciato
export const ZONA_COLORS: Record<ZonaColore, {
  bg: string;
  border: string;
  text: string;
  glow: string;
  badge: string;
  badgeText: string;
  segBg: string;
  segHover: string;
}> = {
  safe: {
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.4)',
    text: '#22c55e',
    glow: '0 0 16px rgba(34,197,94,0.35)',
    badge: 'rgba(34,197,94,0.18)',
    badgeText: '#4ade80',
    segBg: '#14532d',
    segHover: '#166534',
  },
  watch: {
    bg: 'rgba(234,179,8,0.08)',
    border: 'rgba(234,179,8,0.4)',
    text: '#eab308',
    glow: '0 0 16px rgba(234,179,8,0.35)',
    badge: 'rgba(234,179,8,0.18)',
    badgeText: '#facc15',
    segBg: '#713f12',
    segHover: '#854d0e',
  },
  caution: {
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.4)',
    text: '#f97316',
    glow: '0 0 16px rgba(249,115,22,0.35)',
    badge: 'rgba(249,115,22,0.18)',
    badgeText: '#fb923c',
    segBg: '#7c2d12',
    segHover: '#9a3412',
  },
  danger: {
    bg: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.4)',
    text: '#ef4444',
    glow: '0 0 20px rgba(239,68,68,0.40)',
    badge: 'rgba(239,68,68,0.18)',
    badgeText: '#f87171',
    segBg: '#7f1d1d',
    segHover: '#991b1b',
  },
  critical: {
    bg: 'rgba(220,38,38,0.15)',
    border: 'rgba(220,38,38,0.7)',
    text: '#dc2626',
    glow: '0 0 28px rgba(220,38,38,0.6), 0 0 48px rgba(220,38,38,0.3)',
    badge: 'rgba(220,38,38,0.25)',
    badgeText: '#fca5a5',
    segBg: '#450a0a',
    segHover: '#7f1d1d',
  },
  neutral: {
    bg: 'rgba(148,163,184,0.08)',
    border: 'rgba(148,163,184,0.3)',
    text: '#94a3b8',
    glow: '0 0 12px rgba(148,163,184,0.2)',
    badge: 'rgba(148,163,184,0.15)',
    badgeText: '#cbd5e1',
    segBg: '#334155',
    segHover: '#475569',
  },
  coalition: {
    bg: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.4)',
    text: '#3b82f6',
    glow: '0 0 20px rgba(59,130,246,0.35)',
    badge: 'rgba(59,130,246,0.18)',
    badgeText: '#60a5fa',
    segBg: '#1e3a5f',
    segHover: '#1d4ed8',
  },
};
