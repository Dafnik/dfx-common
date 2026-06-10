import { Injectable, PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ThemeService } from './theme-service';
import type { ThemeServiceContract } from './theme-service';
import { provideTheme, withThemeService } from './theme.provider';
import type { Theme } from './theme.types';

@Injectable()
class CustomThemeService implements ThemeServiceContract {
  private readonly themeSignal = signal<Theme>('dark');

  readonly theme = this.themeSignal.asReadonly();
  readonly systemTheme = signal<'light' | 'dark'>('light').asReadonly();
  readonly resolvedTheme = signal<'light' | 'dark'>('dark').asReadonly();
  readonly initialized = false;
  readonly isForced = false;

  initialize = vi.fn();
  setTheme = vi.fn((theme: Theme) => this.themeSignal.set(theme));
  toggle = vi.fn();
  isDark = vi.fn(() => true);
  isLight = vi.fn(() => false);
  isSystem = vi.fn(() => false);
  cleanup = vi.fn();
  ngOnDestroy = vi.fn();
}

describe('provideTheme', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should provide a custom implementation under the ThemeService token', () => {
    TestBed.configureTestingModule({
      providers: [provideTheme(withThemeService(CustomThemeService))],
    });

    expect(TestBed.inject(ThemeService)).toBeInstanceOf(CustomThemeService);
  });

  it('should initialize the custom service in the browser', async () => {
    TestBed.configureTestingModule({
      providers: [provideTheme(withThemeService(CustomThemeService)), { provide: PLATFORM_ID, useValue: 'browser' }],
    });

    await TestBed.compileComponents();

    expect(TestBed.inject(ThemeService).initialize).toHaveBeenCalledOnce();
  });
});
