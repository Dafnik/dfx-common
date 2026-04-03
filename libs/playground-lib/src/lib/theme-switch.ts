import { TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { ThemeService } from 'dfx-theme';

@Component({
  template: `
    <button class="btn-outline" (click)="themeService.toggle()" aria-label="Toggle theme">
      @switch (themeService.theme()) {
        @case ('dark') {
          <svg
            class="lucide lucide-moon-icon lucide-moon"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
          </svg>
        }
        @case ('light') {
          <svg
            class="lucide lucide-sun-icon lucide-sun"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        }
        @case ('system') {
          <svg
            class="lucide lucide-sun-moon-icon lucide-sun-moon"
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M12 2v2" />
            <path d="M14.837 16.385a6 6 0 1 1-7.223-7.222c.624-.147.97.66.715 1.248a4 4 0 0 0 5.26 5.259c.589-.255 1.396.09 1.248.715" />
            <path d="M16 12a4 4 0 0 0-4-4" />
            <path d="m19 5-1.256 1.256" />
            <path d="M20 12h2" />
          </svg>
        }
      }
      <span>{{ themeService.theme() | titlecase }}</span>
    </button>
  `,
  styles: `
    .lucide {
      width: 20px;
      height: 20px;
    }

    .btn-outline {
      gap: 0.25rem;
    }
  `,
  selector: 'playground-theme-switch',
  imports: [TitleCasePipe],
})
export class ThemeSwitch {
  protected readonly themeService = inject(ThemeService);
}
