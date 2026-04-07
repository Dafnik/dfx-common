import { Component, signal } from '@angular/core';

import { GithubButton, Layout, NpmButton, ThemeSwitch } from 'playground-lib';

import { BasicFeatureComponent } from './features/basic-feature.component';
import { CustomTranspilersFeatureComponent } from './features/custom-transpilers';
import { NavigationBarComponent } from './navigation-bar.component';

@Component({
  selector: 'app-root',
  imports: [BasicFeatureComponent, CustomTranspilersFeatureComponent, NavigationBarComponent, GithubButton, Layout, NpmButton, ThemeSwitch],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('dfx-transloco-markup-demo');
}
