import { describe, expect, it } from 'vitest';

import { DEFAULT_THEME_CONFIG, THEME_CONFIG, THEME_STORAGE_KEY, THEME_STORAGE_MANAGER, THEME_STRATEGIES } from './theme.config';

describe('Theme Config', () => {
  it('should have correct DEFAULT_THEME_CONFIG', () => {
    expect(DEFAULT_THEME_CONFIG).toEqual({
      defaultTheme: 'system',
      enableAutoInit: true,
      enableSystem: true,
    });
  });

  it('should create THEME_CONFIG injection token', () => {
    expect(THEME_CONFIG.toString()).toContain('THEME_CONFIG');
  });

  it('should create THEME_STORAGE_KEY injection token with default factory', () => {
    expect(THEME_STORAGE_KEY.toString()).toContain('THEME_STORAGE_KEY');
  });

  it('should create THEME_STORAGE_MANAGER injection token', () => {
    expect(THEME_STORAGE_MANAGER.toString()).toContain('THEME_STORAGE_KEY');
  });

  it('should create THEME_STRATEGIES injection token with default strategies', () => {
    expect(THEME_STRATEGIES.toString()).toContain('THEME_STRATEGIES');
  });
});
