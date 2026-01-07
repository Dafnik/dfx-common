import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SystemThemeManager } from './system-theme-manager';
import { ThemeLocalStorageManager } from './theme.storage';

describe('SystemThemeManager', () => {
  let manager: SystemThemeManager;
  const mockMediaQuery = (matches: boolean) =>
    ({
      matches,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }) as any;

  beforeEach(() => {
    manager = new SystemThemeManager();
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mockMediaQuery(true)));
  });

  it('should detect dark mode correctly', () => {
    manager.setup({ enableSystem: true } as any);
    expect(manager.updateSystemTheme()).toBe('dark');
  });

  it('should cleanup listeners', () => {
    const query = mockMediaQuery(true);
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(query));
    manager.setup({ enableSystem: true } as any);
    const cb = () => {};
    manager.addChangeListener(cb);
    manager.removeChangeListener(cb);
    manager.cleanup();
    expect(query.removeEventListener).toHaveBeenCalled();
  });
});

describe('ThemeLocalStorageManager', () => {
  let manager: ThemeLocalStorageManager;

  beforeEach(() => {
    manager = new ThemeLocalStorageManager();
    localStorage.clear();
  });

  it('should save and load themes', () => {
    manager.setup();
    manager.saveTheme('key', 'dark');
    expect(manager.loadTheme('key')).toBe('dark');
  });

  it('should return undefined for invalid themes', () => {
    manager.setup();
    localStorage.setItem('key', 'invalid');
    expect(manager.loadTheme('key')).toBeUndefined();
    expect(localStorage.getItem('key')).toBeNull(); // Should be cleaned up
  });
});
