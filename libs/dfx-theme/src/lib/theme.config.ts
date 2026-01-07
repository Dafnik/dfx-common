import { InjectionToken } from '@angular/core';

import { themeClassStrategy, themeColorSchemeStrategy } from './theme-strategies';
import { ThemeConfig, ThemeStorageManager, ThemeStrategy } from './theme.types';

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  defaultTheme: 'system',
  enableAutoInit: true,
  enableSystem: true,
};

export const THEME_CONFIG = new InjectionToken<ThemeConfig>('THEME_CONFIG', {
  factory: () => DEFAULT_THEME_CONFIG,
});

export const THEME_STORAGE_KEY = new InjectionToken('THEME_STORAGE_KEY', {
  factory: () => 'theme',
});

export const THEME_STORAGE_MANAGER = new InjectionToken<ThemeStorageManager>('THEME_STORAGE_KEY');

export const THEME_STRATEGIES = new InjectionToken<ThemeStrategy[]>('THEME_STRATEGIES', {
  factory: () => [themeColorSchemeStrategy, themeClassStrategy],
});
