import type { IconName } from './icons';

export const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Start', icon: 'home' },
  { to: '/karte', label: 'Karte', icon: 'map' },
  { to: '/training', label: 'Training', icon: 'training' },
  { to: '/statistik', label: 'Statistik', icon: 'stats' },
  { to: '/erfolge', label: 'Erfolge', icon: 'medal' },
];

export const TAB_PATHS = new Set(TABS.map((t) => t.to));
