import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { TranslocoModule } from '@jsverse/transloco';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
import { TranslocoMarkupComponent } from 'dfx-transloco-markup';
import { PlaygroundCodeSnippetFile, PlaygroundCodeSnippets } from 'playground-lib';

import { defineTranslationKeys } from '../define-translation-keys';

export const BASIC_FEATURE_TRANSLATION_KEYS = defineTranslationKeys((t) => ({
  BASIC: {
    TITLE: t,
    NAME: t,
    GREETING: t,
  },
})).BASIC;

@Component({
  template: `
    <section hlmCard>
      <div hlmCardHeader>
        <h3 hlmCardTitle>{{ TRANSLATIONS.TITLE | transloco }}</h3>
      </div>
      <div hlmCardContent>
        <div hlmField>
          <label hlmFieldLabel for="name-input">{{ TRANSLATIONS.NAME | transloco }}</label>
          <input id="name-input" [formControl]="formControls.name" hlmInput placeholder="Johnny" />
        </div>

        <div class="mt-4">
          <transloco [key]="TRANSLATIONS.GREETING" [params]="{ name: formControls.name.value }"></transloco>
        </div>

        <div class="mt-6 min-w-px text-left">
          <playground-code-snippets [files]="codeSnippets" />
        </div>
      </div>
    </section>
  `,
  selector: 'basic-feature',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslocoModule,
    TranslocoMarkupComponent,
    HlmCardImports,
    HlmFieldImports,
    HlmInputImports,
    PlaygroundCodeSnippets,
  ],
})
export class BasicFeatureComponent {
  protected readonly formControls = {
    name: new FormControl('Timmy'),
  };

  protected readonly TRANSLATIONS = BASIC_FEATURE_TRANSLATION_KEYS;

  protected readonly codeSnippets: PlaygroundCodeSnippetFile[] = [
    {
      id: 'app-config',
      label: 'Config',
      filename: 'app.config.ts',
      lang: 'typescript',
      code: String.raw`import { ApplicationConfig } from '@angular/core';

import { provideTransloco, translocoConfig } from '@jsverse/transloco';
import { defaultTranslocoMarkupTranspilers } from 'dfx-transloco-markup';

export const appConfig: ApplicationConfig = {
  providers: [
    provideTransloco({
      config: translocoConfig({
        availableLangs: ['en', 'nl'],
        defaultLang: 'en',
        reRenderOnLangChange: true,
      }),
      loader: TranslocoHttpLoader,
    }),
    defaultTranslocoMarkupTranspilers(),
  ],
};`,
    },
    {
      id: 'component',
      label: 'Component',
      filename: 'basic-feature.component.ts',
      lang: 'typescript',
      code: String.raw`import { Component } from '@angular/core';

import { TranslocoMarkupComponent } from 'dfx-transloco-markup';

@Component({
  selector: 'basic-feature',
  imports: [TranslocoMarkupComponent],
  template: \`
    <transloco [key]="TRANSLATIONS.GREETING" [params]="{ name: formControls.name.value }"></transloco>
  \`,
})
export class BasicFeatureComponent {
  protected readonly formControls = {
    name: new FormControl('Timmy'),
  };

  protected readonly TRANSLATIONS = BASIC_FEATURE_TRANSLATION_KEYS;
}`,
    },
    {
      id: 'translations',
      label: 'Translation',
      filename: 'en.json',
      lang: 'json',
      code: String.raw`{
  "BASIC": {
    "GREETING": "Hi [b]{{ name }}[/b], welcome to [i]TRANSLOCO [b]<MARKUP>[/b][/i]",
    "NAME": "Name",
    "TITLE": "Basic example"
  }
}`,
    },
  ];
}
