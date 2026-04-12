import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { PlaygroundCodeSnippet } from 'playground-lib';

import { DemoTokenService } from './demo-token.service';
import { routeGuardSnippetFunction } from './routeGuard.snippet';

@Component({
  template: `
    <section class="border border-emerald-200 bg-emerald-50/80 p-6 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/40" hlmCard>
      <div hlmCardContent>
        <p class="text-sm font-medium tracking-[0.24em] text-emerald-700 uppercase dark:text-emerald-300">Guarded route</p>
        <h2 class="mt-2 text-3xl font-semibold">Kundenverwaltung</h2>
        <p class="mt-3 max-w-2xl text-sm text-emerald-900/80 dark:text-emerald-100/80">
          This route is protected with
          <code>authzCanActivate</code>
          against
          <code>test/Kundenverwaltung</code>
          . It is reachable with
          <code>MODERATOR</code>
          and
          <code>ADMIN</code>
          .
        </p>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <article class="rounded-xl border border-emerald-200/80 bg-white/70 p-4 dark:border-emerald-900/70 dark:bg-black/10">
            <h3 class="font-semibold">Current token</h3>
            <p class="mt-2 text-2xl font-semibold">{{ token() }}</p>
          </article>
          <article class="rounded-xl border border-emerald-200/80 bg-white/70 p-4 dark:border-emerald-900/70 dark:bg-black/10">
            <h3 class="font-semibold">Guard outcome</h3>
            <p class="mt-2 text-sm">Allowed by policy before the page component is activated.</p>
          </article>
        </div>

        <div class="mt-6">
          <a hlmBtn variant="link" routerLink="/organisationsverwaltung">Try the stricter Organisationsverwaltung page</a>
        </div>

        <div class="mt-6 min-w-px text-left">
          <playground-code-snippet [code]="routeGuardSnippet" label="Route guard" lang="typescript"></playground-code-snippet>
        </div>

        <div class="mt-6 min-w-px text-left">
          <playground-code-snippet [code]="routeGuardSnippetFunction" label="Route guard function" lang="typescript" />
        </div>
      </div>
    </section>
  `,
  selector: 'app-kundenverwaltung-page',
  imports: [RouterLink, HlmCardImports, HlmButtonImports, PlaygroundCodeSnippet],
})
export class KundenverwaltungPage {
  protected readonly token = inject(DemoTokenService).token;
  protected readonly routeGuardSnippetFunction = routeGuardSnippetFunction;

  protected readonly routeGuardSnippet = `{
  path: 'kundenverwaltung',
  canActivate: [policyGuard('test/Kundenverwaltung')],
  component: KundenverwaltungPage,
}`;
}
