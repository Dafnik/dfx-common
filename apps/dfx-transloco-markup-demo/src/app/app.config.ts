import { HttpClient } from '@angular/common/http';
import { ApplicationConfig, Injectable, inject } from '@angular/core';

import { Observable } from 'rxjs';

import { Translation, TranslocoLoader, provideTransloco, translocoConfig } from '@jsverse/transloco';
import { defaultTranslocoMarkupTranspilers } from 'dfx-transloco-markup';
import { PLAYGROUND_PROVIDERS } from 'playground-lib';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly httpClient = inject(HttpClient);

  public getTranslation(language: string): Observable<Translation> {
    return this.httpClient.get<Translation>(`assets/translations/${language}.json`);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    ...PLAYGROUND_PROVIDERS,
    provideTransloco({
      config: translocoConfig({
        availableLangs: ['en', 'nl'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
        prodMode: false,
      }),
      loader: TranslocoHttpLoader,
    }),
    defaultTranslocoMarkupTranspilers(),
  ],
};
