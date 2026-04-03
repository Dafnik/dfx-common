import { ApplicationConfig, computed, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { provideAuthz } from 'dfx-opa';

import { routes } from './app.routes';
import { DemoTokenService } from './demo-token.service';
import { MockOpaClient } from './mock-opa.client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideAuthz(() => {
      const token = inject(DemoTokenService).token;
      return {
        opaClient: new MockOpaClient('https://localhost'),
        defaultInput: computed(() => ({ token: token() })),
      };
    }),
  ],
};
