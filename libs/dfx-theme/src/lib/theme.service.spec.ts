import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SystemThemeManager } from './system-theme-manager';
import { THEME_CONFIG, THEME_STRATEGIES } from './theme.config';
import { ThemeService } from './theme.service';
import { ThemeConfig } from './theme.types';

describe('ThemeService', () => {
  const baseConfig: ThemeConfig = {
    defaultTheme: 'system',
    enableAutoInit: true,
    enableSystem: true,
  };

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  const setup = (platformId: 'browser' | 'server', config: ThemeConfig = baseConfig): ThemeService => {
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: PLATFORM_ID, useValue: platformId },
        { provide: THEME_CONFIG, useValue: config },
        { provide: THEME_STRATEGIES, useValue: [] },
      ],
    });

    return TestBed.inject(ThemeService);
  };

  it('should remove the exact same system listener instance during cleanup', () => {
    const mediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList;
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue(mediaQuery));

    const addSpy = vi.spyOn(SystemThemeManager.prototype, 'addChangeListener');
    const removeSpy = vi.spyOn(SystemThemeManager.prototype, 'removeChangeListener');

    const service = setup('browser');
    service.initialize();
    service.cleanup();

    expect(addSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy.mock.calls[0][0]).toBe(addSpy.mock.calls[0][0]);
  });

  it('should resolve forced theme on server', () => {
    const service = setup('server', { ...baseConfig, forcedTheme: 'dark' });

    service.initialize();

    expect(service.resolvedTheme()).toBe('dark');
  });

  it('should use a non-system default theme on server', () => {
    const service = setup('server', { ...baseConfig, defaultTheme: 'dark' });

    service.initialize();

    expect(service.resolvedTheme()).toBe('dark');
  });
});
