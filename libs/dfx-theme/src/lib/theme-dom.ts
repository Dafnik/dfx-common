import { ResolvedTheme, ThemeStrategy } from './theme.types';

export function applyTheme(theme: ResolvedTheme, strategies: ThemeStrategy[]): void {
  try {
    const element = document.documentElement;

    for (const strategy of strategies) {
      strategy(element, theme);
    }
  } catch (error) {
    console.error('Failed to apply theme:', error);
  }
}
