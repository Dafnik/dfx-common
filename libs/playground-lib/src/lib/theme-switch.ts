import { TitleCasePipe } from '@angular/common';
import { Component, inject } from '@angular/core';

import { provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun, lucideSunMoon } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { ThemeService } from 'dfx-theme';

@Component({
  template: `
    <button [hlmTooltip]="tooltip" (click)="themeService.toggle()" position="bottom" variant="outline" hlmBtn aria-label="Toggle theme">
      @switch (themeService.theme()) {
        @case ('dark') {
          <ng-icon hlm size="sm" name="lucideMoon" />
        }
        @case ('light') {
          <ng-icon hlm size="sm" name="lucideSun" />
        }
        @case ('system') {
          <ng-icon hlm size="sm" name="lucideSunMoon" />
        }
      }
      <ng-template #tooltip>
        {{ themeService.theme() | titlecase }}
      </ng-template>
    </button>
  `,
  providers: [provideIcons({ lucideMoon, lucideSun, lucideSunMoon })],
  selector: 'playground-theme-switch',
  imports: [TitleCasePipe, HlmButton, HlmIconImports, HlmTooltipImports],
})
export class ThemeSwitch {
  protected readonly themeService = inject(ThemeService);
}
