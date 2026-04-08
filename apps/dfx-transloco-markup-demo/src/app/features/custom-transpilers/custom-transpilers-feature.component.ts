import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TranslocoModule } from '@jsverse/transloco';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { TranslocoMarkupComponent, inheritTranslationMarkupTranspilers, provideTranslationMarkupTranspiler } from 'dfx-transloco-markup';

import { defineTranslationKeys } from '../../define-translation-keys';
import { ColoredTextTranspiler } from './colored-text-transpiler';
import { EmoticonTranspiler } from './emoticon-transpiler';

export const CUSTOM_TRANSPILERS_TRANSLATION_KEYS = defineTranslationKeys((t) => ({
  CUSTOM_TRANSPILERS: {
    TITLE: t,
    MESSAGE: t,
  },
})).CUSTOM_TRANSPILERS;

@Component({
  template: `
    <section hlmCard>
      <div hlmCardHeader>
        <h3 hlmCardTitle>{{ TRANSLATIONS.TITLE | transloco }}</h3>
      </div>
      <div hlmCardContent>
        <transloco [key]="TRANSLATIONS.MESSAGE"></transloco>
      </div>
    </section>
  `,
  selector: 'custom-transpiler-feature',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, TranslocoMarkupComponent, FormsModule, HlmCardImports],
  providers: [
    provideTranslationMarkupTranspiler(EmoticonTranspiler),
    provideTranslationMarkupTranspiler(ColoredTextTranspiler),
    inheritTranslationMarkupTranspilers(),
  ],
})
export class CustomTranspilersFeatureComponent {
  public readonly TRANSLATIONS = CUSTOM_TRANSPILERS_TRANSLATION_KEYS;
}
