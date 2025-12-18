import { HttpClient } from '@angular/common/http';
import { ApplicationConfig, Injectable, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { Observable } from 'rxjs';

import { Translation, TranslocoLoader, provideTransloco, translocoConfig } from '@jsverse/transloco';
import { defaultTranslocoMarkupTranspilers } from 'dfx-transloco-markup';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly httpClient = inject(HttpClient);

  public getTranslation(language: string): Observable<Translation> {
    return this.httpClient.get<Translation>(`assets/translations/${language}.json`);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
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
