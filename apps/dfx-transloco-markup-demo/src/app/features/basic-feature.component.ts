import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { TranslocoModule } from '@jsverse/transloco';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInputImports } from '@spartan-ng/helm/input';
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
      </div>
    </section>
  `,
  selector: 'basic-feature',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslocoModule, TranslocoMarkupComponent, HlmCardImports, HlmFieldImports, HlmInputImports],
})
export class BasicFeatureComponent {
  protected readonly formControls = {
    name: new FormControl('Timmy'),
  };

  protected readonly TRANSLATIONS = BASIC_FEATURE_TRANSLATION_KEYS;
}
