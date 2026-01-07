import { isPlatformBrowser } from '@angular/common';
import { EnvironmentProviders, PLATFORM_ID, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';

import { DEFAULT_THEME_CONFIG, THEME_CONFIG, THEME_STORAGE_KEY, THEME_STORAGE_MANAGER, THEME_STRATEGIES } from './theme.config';
import { ThemeConfigFeature, ThemeFeatureKind, ThemeFeatures, ThemeStorageFeature, ThemeStrategiesFeature } from './theme.feature';
import { ThemeService } from './theme.service';
import { ThemeLocalStorageManager } from './theme.storage';
import { Theme, ThemeConfig, ThemeStorageManager, ThemeStrategy } from './theme.types';

export function provideTheme(...features: ThemeFeatures[]): EnvironmentProviders {
  // @ts-expect-error useValue will exist if users configures it
  const disabledAutoInit = features.find((it) => it.kind === ThemeFeatureKind.CONFIG)?.providers[0]?.['useValue'].enableAutoInit === false;
  return makeEnvironmentProviders([
    features.map((it) => it.providers),
    ...(!disabledAutoInit
      ? [
          provideAppInitializer(() => {
            // Only initialize in browser environment
            if (isPlatformBrowser(inject(PLATFORM_ID))) {
              const themeService = inject(ThemeService);
              themeService.initialize();
            }
          }),
        ]
      : []),
  ]);
}

export function withThemeConfig(userConfig: {
  defaultTheme?: Theme;
  enableAutoInit?: boolean;
  enableSystem?: boolean;
  forcedTheme?: Theme;
}): ThemeConfigFeature {
  const config = { ...DEFAULT_THEME_CONFIG, ...userConfig } satisfies ThemeConfig;
  return {
    kind: ThemeFeatureKind.CONFIG,
    providers: [{ provide: THEME_CONFIG, useValue: config }],
  };
}

export function withThemeStorage(userConfig?: { key?: string; manager?: ThemeStorageManager }): ThemeStorageFeature {
  return {
    kind: ThemeFeatureKind.STORAGE,
    providers: [
      ...(userConfig?.key ? [{ provide: THEME_STORAGE_KEY, useValue: userConfig.key }] : []),
      { provide: THEME_STORAGE_MANAGER, useValue: userConfig?.manager ?? new ThemeLocalStorageManager() },
    ],
  };
}

export function withThemeStrategies(themeStrategies: ThemeStrategy[]): ThemeStrategiesFeature {
  return {
    kind: ThemeFeatureKind.STRATEGIES,
    providers: [{ provide: THEME_STRATEGIES, useValue: themeStrategies }],
  };
}
