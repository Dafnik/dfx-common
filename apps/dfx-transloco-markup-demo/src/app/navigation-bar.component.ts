import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { TranslocoService } from '@jsverse/transloco';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmToggleGroupImports } from '@spartan-ng/helm/toggle-group';

interface LanguageOption {
  languageId: string;
  icon: string;
  name: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { languageId: 'en', icon: 'gb.svg', name: 'English' },
  { languageId: 'nl', icon: 'nl.svg', name: 'Dutch' },
];

@Component({
  template: `
    <hlm-toggle-group [value]="activeLanguage()" (valueChange)="setActiveLanguage($any($event))" variant="outline" type="single">
      @for (languageOption of languageOptions; track $index) {
        <button [value]="languageOption.languageId" [attr.aria-label]="languageOption.name" hlmToggleGroupItem>
          <img
            class="icon"
            [ngSrc]="'assets/images/country-flags/' + languageOption.icon"
            [alt]="languageOption.name"
            width="24"
            height="24" />
        </button>
      }
    </hlm-toggle-group>
  `,
  selector: 'language-switcher',
  styles: `
    :host {
      display: block;
    }

    img.icon {
      width: 24px;
      height: 24px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgOptimizedImage, HlmToggleGroupImports],
})
export class NavigationBarComponent {
  private readonly translocoService = inject(TranslocoService);

  protected readonly activeLanguage = toSignal(this.translocoService.langChanges$, { requireSync: true });
  protected readonly languageOptions = LANGUAGE_OPTIONS;

  public setActiveLanguage(language: string): void {
    this.translocoService.setActiveLang(language);
  }
}
