import { Component, signal } from '@angular/core';

import { GithubButton, Layout, NpmButton, ThemeSwitch } from 'playground-lib';

import { BasicFeatureComponent } from './features/basic-feature.component';
import { CustomTranspilersFeatureComponent } from './features/custom-transpilers';
import { NavigationBarComponent } from './navigation-bar.component';

@Component({
  template: `
    <playground-layout project="dfx-transloco-markup">
      <nav>
        <playground-theme-switch />
        <playground-github-button />
        <playground-npm-button />
      </nav>

      <div class="grid gap-4">
        <language-switcher />

        <basic-feature />

        <custom-transpiler-feature />
      </div>
    </playground-layout>
  `,
  selector: 'app-root',
  imports: [BasicFeatureComponent, CustomTranspilersFeatureComponent, NavigationBarComponent, GithubButton, Layout, NpmButton, ThemeSwitch],
})
export class App {
  protected readonly title = signal('dfx-transloco-markup-demo');
}
