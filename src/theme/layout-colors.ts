export const APP_LAYOUT_COLORS = {
  backgroundLight: '#eef3f9',
  backgroundDark: '#0a0e16',
  drawerLight: '#edf3fb',
  drawerDark: '#0a0e16',
  textLight: '#0f172a',
  textDark: '#f4f4f5',
  primaryLight: '#2563eb',
  primaryDark: '#60a5fa',
  borderLight: 'rgba(20,34,53,0.08)',
  borderDark: 'rgba(113,113,122,0.34)',
  notificationLight: '#dc2626',
  notificationDark: '#ef4444',
} as const;

export type AppLayoutColors = typeof APP_LAYOUT_COLORS;
