import { TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun, lucideSunMoon } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { ThemeService } from 'dfx-theme';

@Component({
  template: `
    <button [hlmTooltip]="tooltip" (click)="themeService.toggle()" position="bottom" variant="outline" hlmBtn aria-label="Toggle theme">
      @switch (themeService.theme()) {
        @case ('dark') {
          <ng-icon name="lucideMoon" />
        }
        @case ('light') {
          <ng-icon name="lucideSun" />
        }
        @case ('system') {
          <ng-icon name="lucideSunMoon" />
        }
      }
      <ng-template #tooltip>
        {{ themeService.theme() | titlecase }}
      </ng-template>
    </button>
  `,
  providers: [provideIcons({ lucideMoon, lucideSun, lucideSunMoon })],
  selector: 'playground-theme-switch',
  imports: [TitleCasePipe, HlmButton, HlmTooltipImports, NgIcon],
})
export class ThemeSwitch {
  protected readonly themeService = inject(ThemeService);
}
