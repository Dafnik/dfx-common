import { Location } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { filter, map, tap } from 'rxjs';

import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { GithubButton, Layout, NpmButton, ThemeSwitch } from 'playground-lib';

import { DemoTokenService } from './demo-token.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [
    FormsModule,
    GithubButton,
    Layout,
    NpmButton,
    RouterLink,
    RouterOutlet,
    ThemeSwitch,
    HlmCardImports,
    HlmSelectImports,
    HlmFieldImports,
    HlmTabsImports,
  ],
})
export class App {
  protected readonly globalToken = inject(DemoTokenService).token;
  protected readonly url = toSignal(
    inject(Router).events.pipe(
      filter((it) => it instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: '/' },
  );
}
