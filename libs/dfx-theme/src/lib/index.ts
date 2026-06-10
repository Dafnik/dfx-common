export { SystemThemeManager } from './system-theme-manager';

export { DEFAULT_THEME_CONFIG, THEME_CONFIG, THEME_STORAGE_KEY, THEME_STORAGE_MANAGER, THEME_STRATEGIES } from './theme-config';

export { applyTheme } from './theme-dom';

export { ThemeService } from './theme-service';
export type { ThemeServiceContract } from './theme-service';

export { provideTheme, withThemeConfig, withThemeService, withThemeStorage, withThemeStrategies } from './theme.provider';

export { ThemeLocalStorageManager } from './theme-storage/theme.storage';

export type { ResolvedTheme, Theme, ThemeConfig, ThemeStrategy, ThemeStorageManager } from './theme.types';

export { themeAttributeStrategy, themeClassStrategy, themeColorSchemeStrategy } from './theme-strategies';
