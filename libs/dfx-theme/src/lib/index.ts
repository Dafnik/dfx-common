export { ThemeService } from './theme.service';
export { provideTheme, withThemeConfig, withThemeStorage, withThemeStrategies } from './theme.provider';
export { ThemeLocalStorageManager } from './theme.storage';
export type { ResolvedTheme, Theme, ThemeConfig, ThemeStrategy, ThemeStorageManager } from './theme.types';

export { themeAttributeStrategy, themeClassStrategy, themeColorSchemeStrategy } from './theme-strategies';
