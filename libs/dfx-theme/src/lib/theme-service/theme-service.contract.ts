import type { OnDestroy, Signal } from '@angular/core';

import type { ResolvedTheme, Theme } from '../theme.types';

export interface ThemeServiceContract extends OnDestroy {
  readonly theme: Signal<Theme>;
  readonly systemTheme: Signal<ResolvedTheme>;
  readonly resolvedTheme: Signal<ResolvedTheme>;

  readonly initialized: boolean;
  readonly isForced: boolean;

  initialize(): void;
  setTheme(theme: Theme): void;
  toggle(): void;
  isDark(): boolean;
  isLight(): boolean;
  isSystem(): boolean;
  cleanup(): void;
}
