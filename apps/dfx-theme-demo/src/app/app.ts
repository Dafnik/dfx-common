import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun, lucideSunMoon } from '@ng-icons/lucide';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { ThemeService } from 'dfx-theme';
import { GithubButton, Layout, NpmButton, ThemeSwitch } from 'playground-lib';

@Component({
  template: `
    <playground-layout project="dfx-theme">
      <nav>
        <playground-theme-switch />
        <playground-github-button />
        <playground-npm-button />
      </nav>

      <section hlmCard>
        <div class="text-center" hlmCardContent>
          <h3 class="mb-6 text-xl font-semibold">Try Theme Switching</h3>

          <div class="space-y-6">
            <button (click)="toggleTheme()" hlmBtn size="lg" aria-label="Toggle between light and dark theme">Toggle Theme</button>

            <div class="flex flex-wrap justify-center gap-3" role="group" aria-label="Theme selection buttons">
              <button (click)="setTheme('light')" hlmBtn variant="secondary" aria-label="Switch to light theme">
                <ng-icon hlm size="sm" name="lucideSun" />
                Light
              </button>
              <button (click)="setTheme('dark')" hlmBtn variant="secondary" aria-label="Switch to dark theme">
                <ng-icon hlm size="sm" name="lucideMoon" />
                Dark
              </button>
              <button (click)="setTheme('system')" hlmBtn variant="secondary" aria-label="Use system theme preference">
                <ng-icon hlm size="sm" name="lucideSunMoon" />
                System
              </button>
            </div>
          </div>

          <!-- Theme Status -->
          <div class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <article hlmCard>
              <div hlmCardContent>
                <div class="text-muted-foreground mb-1 text-sm">Current</div>
                <div class="text-accent-foreground text-lg font-semibold capitalize">{{ currentTheme() }}</div>
              </div>
            </article>
            <article hlmCard>
              <div hlmCardContent>
                <div class="text-muted-foreground mb-1 text-sm">Resolved</div>
                <div class="text-accent-foreground text-lg font-semibold capitalize">{{ resolvedTheme() }}</div>
              </div>
            </article>
            <article hlmCard>
              <div hlmCardContent>
                <div class="text-muted-foreground mb-1 text-sm">System</div>
                <div class="text-accent-foreground text-lg font-semibold capitalize">{{ systemTheme() }}</div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </playground-layout>
  `,
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideIcons({ lucideSun, lucideMoon, lucideSunMoon })],
  imports: [GithubButton, Layout, NpmButton, ThemeSwitch, HlmCardImports, HlmButtonImports, HlmIconImports],
})
export class App {
  private themeService = inject(ThemeService);

  // Theme signals
  protected readonly currentTheme = this.themeService.theme;
  protected readonly resolvedTheme = this.themeService.resolvedTheme;
  protected readonly systemTheme = this.themeService.systemTheme;

  // Theme methods
  protected toggleTheme() {
    this.themeService.toggle();
  }

  protected setTheme(theme: 'light' | 'dark' | 'system') {
    this.themeService.setTheme(theme);
  }
}
