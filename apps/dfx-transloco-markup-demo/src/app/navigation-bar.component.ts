import { AsyncPipe, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { TranslocoService } from '@jsverse/transloco';

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
    <div class="flex items-center justify-between px-6 py-4">
      <div>
        <span class="text-lg font-semibold text-gray-900">Transloco &lt;Markup&gt;</span>
      </div>

      <!-- Right Section -->
      <div class="flex gap-2">
        @for (languageOption of languageOptions; track $index) {
          <button
            class="rounded-full p-2 transition-colors hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
            [class.ring-2]="(activeLanguage$ | async) === languageOption.languageId"
            [class.ring-blue-500]="(activeLanguage$ | async) === languageOption.languageId"
            [attr.aria-label]="languageOption.name"
            [attr.aria-pressed]="(activeLanguage$ | async) === languageOption.languageId"
            (click)="setActiveLanguage(languageOption.languageId)"
            type="button">
            <img
              class="icon"
              [ngSrc]="'assets/images/country-flags/' + languageOption.icon"
              [alt]="languageOption.name"
              width="24"
              height="24" />
          </button>
        }
      </div>
    </div>
  `,
  selector: 'app-navigation-bar',
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
  imports: [AsyncPipe, NgOptimizedImage],
})
export class NavigationBarComponent {
  private readonly translocoService = inject(TranslocoService);

  protected activeLanguage$ = this.translocoService.langChanges$;

  public readonly languageOptions = LANGUAGE_OPTIONS;

  public setActiveLanguage(language: string): void {
    this.translocoService.setActiveLang(language);
  }
}
