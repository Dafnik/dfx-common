import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, DOCUMENT, PLATFORM_ID, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { injectWindow } from 'dfx-helper';

interface Theme {
  id: 'auto' | 'dark' | 'light';
  name: string;
}

@Component({
  template: `
    <div class="d-flex align-items-center gap-2">
      <select class="rounded-3 px-2" id="theme" (change)="setTheme($any($event.target).value)" name="theme">
        @for (theme of themes; track theme.id) {
          <option [value]="theme.id">
            {{ theme.name }}
          </option>
        }
      </select>
    </div>
  `,
  styles: `
    a {
      text-decoration: none;
    }
  `,
  selector: 'theme-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
})
export class ThemePicker {
  themes: Theme[] = [
    { id: 'auto', name: 'Auto' },
    { id: 'light', name: 'Light' },
    { id: 'dark', name: 'Dark' },
  ];

  currentTheme = signal<Theme>(this.themes[0]);

  private document = inject(DOCUMENT);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private window = injectWindow();

  constructor() {
    const theme = this.isBrowser ? this.themes.find((t) => t.id === localStorage.getItem('theme')) : undefined;
    if (theme) {
      this.currentTheme.set(theme);
    }
    this.setTheme(this.getPreferredTheme().id);

    this.window?.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (this.currentTheme().id !== 'light' || this.currentTheme().id !== 'dark') {
        this.setTheme(this.getPreferredTheme().id);
      }
    });
  }

  getPreferredTheme(): Theme {
    if (this.currentTheme) {
      return this.currentTheme();
    } else if (this.window?.matchMedia('(prefers-color-scheme: dark)').matches) {
      return this.themes.find((t) => t.id === 'dark')!;
    } else {
      return this.themes.find((t) => t.id === 'light')!;
    }
  }

  setTheme(id: Theme['id']): void {
    const theme = this.themes.find((t) => t.id === id)!;
    this.currentTheme.set(theme);
    if (this.isBrowser) {
      localStorage.setItem('theme', theme.id);
    }
    if (theme.id === 'auto' && this.window?.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.document.documentElement.setAttribute('data-bs-theme', 'dark');
    } else {
      this.document.documentElement.setAttribute('data-bs-theme', theme.id);
    }
  }
}
