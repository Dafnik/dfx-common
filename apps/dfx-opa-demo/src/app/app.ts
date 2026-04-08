import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';

import { filter, map } from 'rxjs';

import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';
import { GithubButton, Layout, NpmButton, ThemeSwitch } from 'playground-lib';

import { DemoTokenService } from './demo-token.service';

@Component({
  template: `
    <playground-layout project="dfx-opa">
      <nav>
        <playground-theme-switch />
        <playground-github-button />
        <playground-npm-button />
      </nav>

      <section hlmCard>
        <div hlmCardContent>
          <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-2xl">
              <p class="text-muted-foreground text-start text-sm">
                Switch the shared demo token and navigate through the guarded pages to see how the same OPA permissions drive both routed
                access and in-page UI state.
              </p>
            </div>

            <div hlmField>
              <label hlmFieldLabel for="globalToken">Global default role</label>

              <hlm-select id="globalToken" [(ngModel)]="globalToken">
                <hlm-select-trigger class="w-56">
                  <hlm-select-value placeholder="Select a fruit" />
                </hlm-select-trigger>
                <hlm-select-content *hlmSelectPortal>
                  <hlm-select-group>
                    <hlm-select-label>Roles</hlm-select-label>
                    <hlm-select-item value="MODERATOR">MODERATOR</hlm-select-item>
                    <hlm-select-item value="ADMIN">ADMIN</hlm-select-item>
                    <hlm-select-item value="GUEST">GUEST</hlm-select-item>
                  </hlm-select-group>
                </hlm-select-content>
              </hlm-select>
            </div>
          </div>
          <hlm-tabs class="mt-6" [tab]="url()">
            <hlm-tabs-list
              class="[&>a]:data-[state=active]:bg-primary [&>a]:dark:data-[state=active]:bg-primary [&>a]:data-[state=active]:text-primary-foreground [&>a]:dark:data-[state=active]:text-primary-foreground grid grid-cols-3 bg-transparent [&>a]:data-[state=active]:rounded-full [&>a]:data-[state=active]:shadow-none"
              aria-label="tabs example">
              <a class="font-normal" routerLink="/" hlmTabsTrigger="/">Home</a>
              <a class="font-normal" routerLink="/kundenverwaltung" hlmTabsTrigger="/kundenverwaltung">Kundenverwaltung</a>
              <a class="font-normal" routerLink="/organisationsverwaltung" hlmTabsTrigger="/organisationsverwaltung">
                Organisationsverwaltung
              </a>
            </hlm-tabs-list>
          </hlm-tabs>
        </div>
      </section>

      <section class="mt-8" hlmCard>
        <div hlmCardContent>
          <router-outlet />
        </div>
      </section>
    </playground-layout>
  `,
  selector: 'app-root',
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
