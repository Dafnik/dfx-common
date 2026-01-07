import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ThemeService } from 'dfx-theme';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
