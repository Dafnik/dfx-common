import { Component, signal } from '@angular/core';

import { GithubButton, Layout, NpmButton, PackageManagerInstall, ThemeSwitch } from 'playground-lib';

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

      <div class="mb-8 grid gap-4">
        <language-switcher />

        <basic-feature class="min-w-px" />

        <custom-transpiler-feature class="min-w-px" />
      </div>

      <playground-pm-install />
    </playground-layout>
  `,
  selector: 'app-root',
  imports: [
    BasicFeatureComponent,
    CustomTranspilersFeatureComponent,
    NavigationBarComponent,
    GithubButton,
    Layout,
    NpmButton,
    ThemeSwitch,
    PackageManagerInstall,
  ],
})
export class App {
  protected readonly title = signal('dfx-transloco-markup-demo');
}
