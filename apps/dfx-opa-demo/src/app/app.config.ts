import { ApplicationConfig, computed, inject } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideAuthz } from 'dfx-opa';
import { PLAYGROUND_PROVIDERS } from 'playground-lib';

import { routes } from './app.routes';
import { DemoTokenService } from './demo-token.service';
import { MockOpaClient } from './mock-opa.client';

export const appConfig: ApplicationConfig = {
  providers: [
    ...PLAYGROUND_PROVIDERS,
    provideRouter(routes),
    provideAuthz(() => {
      const token = inject(DemoTokenService).token;
      return {
        opaClient: new MockOpaClient('https://localhost'),
        defaultInput: computed(() => ({ token: token() })),
      };
    }),
  ],
};
