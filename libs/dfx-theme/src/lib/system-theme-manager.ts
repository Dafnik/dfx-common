import { ThemeConfig } from './theme.types';

export class SystemThemeManager {
  mediaQuery: MediaQueryList | null = null;
  private isDestroyed = false;

  setup(config: ThemeConfig): void {
    try {
      if (typeof window !== 'undefined' && window.matchMedia && config.enableSystem && !this.isDestroyed) {
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        this.updateSystemTheme();
      }
    } catch (error) {
      console.warn('Failed to setup media query for system theme detection:', error);
    }
  }

  updateSystemTheme(): 'light' | 'dark' {
    try {
      if (this.mediaQuery && !this.isDestroyed) {
        return this.mediaQuery.matches ? 'dark' : 'light';
      }
      return 'light';
    } catch (error) {
      console.warn('Failed to update system theme:', error);
      return 'light';
    }
  }

  addChangeListener(callback: () => void): void {
    if (this.mediaQuery && !this.isDestroyed) {
      this.mediaQuery.addEventListener('change', callback);
    }
  }

  removeChangeListener(callback: () => void): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', callback);
    }
  }

  cleanup(): void {
    this.isDestroyed = true;
    this.mediaQuery = null;
  }
}
