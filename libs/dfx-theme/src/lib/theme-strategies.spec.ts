import { beforeEach, describe, expect, it, vi } from 'vitest';

import { themeAttributeStrategy, themeClassStrategy, themeColorSchemeStrategy } from './theme-strategies';

describe('Theme Strategies', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = {
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
      },
      setAttribute: vi.fn(),
      style: {},
    } as unknown as HTMLElement;
  });

  describe('themeClassStrategy', () => {
    it('should add dark class for dark theme', () => {
      themeClassStrategy(mockElement, 'dark');

      expect(mockElement.classList.add).toHaveBeenCalledWith('dark');
    });

    it('should remove dark class for light theme', () => {
      themeClassStrategy(mockElement, 'light');

      expect(mockElement.classList.remove).toHaveBeenCalledWith('dark');
    });

    it('should handle errors gracefully', () => {
      const errorElement = {
        classList: {
          add: () => {
            throw new Error('DOM error');
          },
        },
      } as unknown as HTMLElement;
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      themeClassStrategy(errorElement, 'dark');

      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('themeAttributeStrategy', () => {
    it('should set data-theme attribute to dark', () => {
      themeAttributeStrategy(mockElement, 'dark');

      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should set data-theme attribute to light', () => {
      themeAttributeStrategy(mockElement, 'light');

      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light');
    });

    it('should handle errors gracefully', () => {
      const errorElement = {
        setAttribute: () => {
          throw new Error('DOM error');
        },
      } as unknown as HTMLElement;
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      themeAttributeStrategy(errorElement, 'dark');

      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('themeColorSchemeStrategy', () => {
    it('should set colorScheme style to dark', () => {
      themeColorSchemeStrategy(mockElement, 'dark');

      expect(mockElement.style.colorScheme).toBe('dark');
    });

    it('should set colorScheme style to light', () => {
      themeColorSchemeStrategy(mockElement, 'light');

      expect(mockElement.style.colorScheme).toBe('light');
    });

    it('should handle errors gracefully', () => {
      const errorElement = {
        style: {
          set colorScheme(value: string) {
            throw new Error('Style error');
          },
        },
      } as unknown as HTMLElement;
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      themeColorSchemeStrategy(errorElement, 'dark');

      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
