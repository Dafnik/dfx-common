import { provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { provideTheme, withThemeStorage } from 'dfx-theme';

export const PLAYGROUND_PROVIDERS = [
  provideBrowserGlobalErrorListeners(),
  provideClientHydration(withEventReplay()),
  provideTheme(withThemeStorage()),
];
