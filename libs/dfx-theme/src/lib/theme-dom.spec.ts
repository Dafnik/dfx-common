import { beforeEach, describe, expect, it, vi } from 'vitest';

import { applyTheme } from './theme-dom';
import { themeAttributeStrategy, themeClassStrategy, themeColorSchemeStrategy } from './theme-strategies';

describe('Theme Strategies & DOM', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
  });

  describe('themeClassStrategy', () => {
    it('should toggle dark class', () => {
      themeClassStrategy(element, 'dark');
      expect(element.classList.contains('dark')).toBe(true);
      themeClassStrategy(element, 'light');
      expect(element.classList.contains('dark')).toBe(false);
    });

    it('should handle classList errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const mockElement = {
        classList: {
          add: () => {
            throw new Error('classList access denied');
          },
        },
      } as unknown as HTMLElement;

      themeClassStrategy(mockElement, 'dark');

      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to apply class theme:', expect.any(Error));

      consoleWarnSpy.mockRestore();
    });

    it('should handle missing classList gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const mockElement = { classList: null } as unknown as HTMLElement;

      themeClassStrategy(mockElement, 'dark');

      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('themeAttributeStrategy', () => {
    it('should toggle data-theme attribute', () => {
      themeAttributeStrategy(element, 'dark');
      expect(element.getAttribute('data-theme')).toBe('dark');
      themeAttributeStrategy(element, 'light');
      expect(element.getAttribute('data-theme')).toBe('light');
    });

    it('should handle setAttribute errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const mockElement = {
        setAttribute: () => {
          throw new Error('setAttribute access denied');
        },
      } as unknown as HTMLElement;

      themeAttributeStrategy(mockElement, 'dark');

      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to apply attribute theme:', expect.any(Error));

      consoleWarnSpy.mockRestore();
    });

    it('should handle missing setAttribute gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const mockElement = { setAttribute: null } as unknown as HTMLElement;

      themeAttributeStrategy(mockElement, 'dark');

      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('themeColorSchemeStrategy', () => {
    it('should set style.colorScheme', () => {
      themeColorSchemeStrategy(element, 'dark');
      expect(element.style.colorScheme).toBe('dark');
      themeColorSchemeStrategy(element, 'light');
      expect(element.style.colorScheme).toBe('light');
    });

    it('should handle style assignment errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const mockElement = {
        style: {
          set colorScheme(_value: string) {
            throw new Error('style access denied');
          },
        },
      } as unknown as HTMLElement;

      themeColorSchemeStrategy(mockElement, 'dark');

      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to apply color scheme:', expect.any(Error));

      consoleWarnSpy.mockRestore();
    });

    it('should handle missing style property gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      const mockElement = { style: null } as unknown as HTMLElement;

      themeColorSchemeStrategy(mockElement, 'dark');

      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('applyTheme', () => {
    it('should execute all provided strategies', () => {
      const strategy1 = vi.fn();
      const strategy2 = vi.fn();

      applyTheme('dark', [strategy1, strategy2]);

      expect(strategy1).toHaveBeenCalledWith(document.documentElement, 'dark');
      expect(strategy2).toHaveBeenCalledWith(document.documentElement, 'dark');
    });

    it('should handle empty strategies array', () => {
      expect(() => applyTheme('dark', [])).not.toThrow();
    });

    it('should handle strategy execution errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const errorStrategy = vi.fn(() => {
        throw new Error('Strategy failed');
      });

      applyTheme('dark', [errorStrategy]);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to apply theme:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });

    it('should stop executing strategies after first error', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const failingStrategy = vi.fn(() => {
        throw new Error('First strategy failed');
      });
      const successStrategy = vi.fn();

      applyTheme('dark', [failingStrategy, successStrategy]);

      expect(failingStrategy).toHaveBeenCalled();
      expect(successStrategy).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should handle undefined strategies gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');

      applyTheme('dark', undefined as unknown as any[]);

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should apply theme to light and dark themes', () => {
      const strategy = vi.fn();

      applyTheme('light', [strategy]);
      expect(strategy).toHaveBeenCalledWith(document.documentElement, 'light');

      applyTheme('dark', [strategy]);
      expect(strategy).toHaveBeenCalledWith(document.documentElement, 'dark');
    });

    it('should handle multiple strategies with mixed success and failure', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const successStrategy1 = vi.fn();
      const failingStrategy = vi.fn(() => {
        throw new Error('Strategy failed');
      });
      const successStrategy2 = vi.fn();

      applyTheme('dark', [successStrategy1, failingStrategy, successStrategy2]);

      expect(successStrategy1).toHaveBeenCalled();
      expect(failingStrategy).toHaveBeenCalled();
      expect(successStrategy2).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
