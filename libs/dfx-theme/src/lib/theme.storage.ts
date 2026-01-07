import { Injectable } from '@angular/core';

import { Theme, ThemeStorageManager } from './theme.types';

@Injectable()
export class ThemeLocalStorageManager implements ThemeStorageManager {
  storage?: Storage;

  setup(): void {
    try {
      const testKey = '__theme_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.storage = localStorage;
    } catch (error) {
      console.warn('localStorage is not available, theme preferences will not be persisted:', error);
    }
  }

  loadTheme(storageKey: string) {
    if (!this.storage) {
      return undefined;
    }
    try {
      const storedTheme = this.storage.getItem(storageKey);

      if (storedTheme && ['light', 'dark', 'system'].includes(storedTheme)) {
        return storedTheme as Theme;
      } else {
        if (storedTheme) {
          this.storage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.warn('Failed to load theme from storage:', error);
    }

    return undefined;
  }

  saveTheme(storageKey: string, theme: Theme): void {
    if (!this.storage) return;

    try {
      this.storage.setItem(storageKey, theme);
    } catch (error) {
      console.warn('Failed to save theme to storage:', error);
    }
  }
}
