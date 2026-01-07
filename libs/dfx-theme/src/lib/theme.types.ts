export type ResolvedTheme = 'light' | 'dark';

export type Theme = ResolvedTheme | 'system';

export interface ThemeConfig {
  defaultTheme: Theme;
  enableAutoInit: boolean;
  enableSystem: boolean;
  forcedTheme?: Theme;
}

export type ThemeStrategy = (element: HTMLElement, theme: ResolvedTheme) => void;

export interface ThemeStorageManager {
  storage?: Storage;
  setup(): void;
  loadTheme(storageKey: string): Theme | undefined;
  saveTheme(storageKey: string, theme: Theme): void;
}
