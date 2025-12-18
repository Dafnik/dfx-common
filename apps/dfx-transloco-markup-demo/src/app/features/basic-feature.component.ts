import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { TranslocoModule } from '@jsverse/transloco';
import { TranslocoMarkupComponent } from 'dfx-transloco-markup';

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
    <div class="rounded-lg border border-gray-200 bg-white shadow-sm">
      <!-- Card Header -->
      <div class="border-b border-gray-200 px-6 py-4">
        <h2 class="text-xl font-semibold text-gray-900">
          {{ TRANSLATIONS.TITLE | transloco }}
        </h2>
      </div>

      <!-- Card Content -->
      <div class="px-6 py-4">
        <!-- Form Field -->
        <div class="mb-4">
          <label class="mb-2 block text-sm font-medium text-gray-700" for="name-input">
            {{ TRANSLATIONS.NAME | transloco }}
          </label>
          <input
            class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
            id="name-input"
            [formControl]="formControls.name"
            type="text" />
        </div>

        <!-- Greeting Text -->
        <div class="text-gray-700">
          <transloco [key]="TRANSLATIONS.GREETING" [params]="{ name: formControls.name.value }"></transloco>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
  selector: 'app-basic-feature',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslocoModule, TranslocoMarkupComponent],
})
export class BasicFeatureComponent {
  protected readonly formControls = {
    name: new FormControl('Timmy'),
  };

  protected readonly TRANSLATIONS = BASIC_FEATURE_TRANSLATION_KEYS;
}
