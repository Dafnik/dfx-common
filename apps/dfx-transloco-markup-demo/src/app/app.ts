import { Component, signal } from '@angular/core';

import { BasicFeatureComponent } from './features/basic-feature.component';
import { CustomTranspilersFeatureComponent } from './features/custom-transpilers';
import { NavigationBarComponent } from './navigation-bar.component';

@Component({
  selector: 'app-root',
  imports: [BasicFeatureComponent, CustomTranspilersFeatureComponent, NavigationBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('dfx-transloco-markup-demo');
}
