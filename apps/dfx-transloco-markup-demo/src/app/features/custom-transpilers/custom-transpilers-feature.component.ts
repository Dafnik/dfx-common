import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TranslocoModule } from '@jsverse/transloco';
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
    <div class="rounded-lg border border-gray-200 bg-white shadow-sm">
      <!-- Card Header -->
      <div class="border-b border-gray-200 px-6 py-4">
        <h2 class="text-xl font-semibold text-gray-900">
          {{ TRANSLATIONS.TITLE | transloco }}
        </h2>
      </div>

      <!-- Card Content -->
      <div class="px-6 py-4">
        <div class="text-gray-700">
          <transloco [key]="TRANSLATIONS.MESSAGE"></transloco>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  selector: 'app-custom-transpilers-feature',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslocoModule, TranslocoMarkupComponent, FormsModule],
  providers: [
    provideTranslationMarkupTranspiler(EmoticonTranspiler),
    provideTranslationMarkupTranspiler(ColoredTextTranspiler),
    inheritTranslationMarkupTranspilers(),
  ],
})
export class CustomTranspilersFeatureComponent {
  public readonly TRANSLATIONS = CUSTOM_TRANSPILERS_TRANSLATION_KEYS;
}
