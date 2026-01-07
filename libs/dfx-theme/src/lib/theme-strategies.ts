import { ResolvedTheme, ThemeStrategy } from './theme.types';

export const themeClassStrategy: ThemeStrategy = (element: HTMLElement, theme: ResolvedTheme) => {
  try {
    if (theme === 'dark') {
      element.classList.add('dark');
    } else {
      element.classList.remove('dark');
    }
  } catch (error) {
    console.warn('Failed to apply class theme:', error);
  }
};

export const themeAttributeStrategy: ThemeStrategy = (element: HTMLElement, theme: ResolvedTheme) => {
  try {
    if (theme === 'dark') {
      element.setAttribute('data-theme', 'dark');
    } else {
      element.setAttribute('data-theme', 'light');
    }
  } catch (error) {
    console.warn('Failed to apply attribute theme:', error);
  }
};

export const themeColorSchemeStrategy: ThemeStrategy = (element: HTMLElement, theme: ResolvedTheme) => {
  try {
    element.style.colorScheme = theme;
  } catch (error) {
    console.warn('Failed to apply color scheme:', error);
  }
};
