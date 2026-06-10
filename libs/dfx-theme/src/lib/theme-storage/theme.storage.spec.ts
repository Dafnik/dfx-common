import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeLocalStorageManager } from './theme.storage';

describe('ThemeLocalStorageManager', () => {
  let manager: ThemeLocalStorageManager;
  let mockStorage: Storage;

  beforeEach(() => {
    manager = new ThemeLocalStorageManager();
    mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };
  });

  describe('setup', () => {
    it('should initialize storage when localStorage is available', () => {
      vi.stubGlobal('localStorage', mockStorage);

      manager.setup();

      expect(manager.storage).toBe(mockStorage);
      expect(mockStorage.setItem).toHaveBeenCalledWith('__theme_test__', 'test');
      expect(mockStorage.removeItem).toHaveBeenCalledWith('__theme_test__');

      vi.unstubAllGlobals();
    });

    it('should not set storage when localStorage is unavailable', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn');
      vi.stubGlobal('localStorage', undefined);

      manager.setup();

      expect(manager.storage).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalled();

      vi.unstubAllGlobals();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('loadTheme', () => {
    it('should return undefined when storage is not initialized', () => {
      manager.storage = undefined;

      const result = manager.loadTheme('theme');

      expect(result).toBeUndefined();
    });

    it('should return valid theme from storage', () => {
      manager.storage = mockStorage;
      (mockStorage.getItem as any).mockReturnValue('dark');

      const result = manager.loadTheme('theme');

      expect(result).toBe('dark');
      expect(mockStorage.getItem).toHaveBeenCalledWith('theme');
    });

    it('should handle light theme', () => {
      manager.storage = mockStorage;
      (mockStorage.getItem as any).mockReturnValue('light');

      const result = manager.loadTheme('theme');

      expect(result).toBe('light');
    });

    it('should handle system theme', () => {
      manager.storage = mockStorage;
      (mockStorage.getItem as any).mockReturnValue('system');

      const result = manager.loadTheme('theme');

      expect(result).toBe('system');
    });

    it('should return undefined for invalid theme', () => {
      manager.storage = mockStorage;
      (mockStorage.getItem as any).mockReturnValue('invalid');

      const result = manager.loadTheme('theme');

      expect(result).toBeUndefined();
    });

    it('should remove invalid theme from storage', () => {
      manager.storage = mockStorage;
      (mockStorage.getItem as any).mockReturnValue('invalid');

      manager.loadTheme('theme');

      expect(mockStorage.removeItem).toHaveBeenCalledWith('theme');
    });

    it('should return undefined when storage is null', () => {
      manager.storage = mockStorage;
      (mockStorage.getItem as any).mockReturnValue(null);

      const result = manager.loadTheme('theme');

      expect(result).toBeUndefined();
    });

    it('should handle storage errors gracefully', () => {
      manager.storage = mockStorage;
      (mockStorage.getItem as any).mockImplementation(() => {
        throw new Error('Storage access denied');
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      const result = manager.loadTheme('theme');

      expect(result).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('saveTheme', () => {
    it('should save theme to storage', () => {
      manager.storage = mockStorage;

      manager.saveTheme('theme', 'dark');

      expect(mockStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should not save when storage is not initialized', () => {
      manager.storage = undefined;

      manager.saveTheme('theme', 'dark');

      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', () => {
      manager.storage = mockStorage;
      (mockStorage.setItem as any).mockImplementation(() => {
        throw new Error('Quota exceeded');
      });
      const consoleWarnSpy = vi.spyOn(console, 'warn');

      manager.saveTheme('theme', 'dark');

      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });
});
