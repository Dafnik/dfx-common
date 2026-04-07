import { ApplicationConfig, computed, inject } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideAuthz } from 'dfx-opa';
import { PLAYGROUND_PROVIDERS } from 'playground-lib';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { DemoTokenService } from './demo-token.service';

export const appConfig: ApplicationConfig = {
  providers: [
    ...PLAYGROUND_PROVIDERS,
    provideRouter(routes),
    provideAuthz(() => {
      const token = inject(DemoTokenService).token;
      return {
        opaClient: environment.opaClient,
        defaultInput: computed(() => ({ token: token() })),
        cache: {},
      };
    }),
  ],
};
