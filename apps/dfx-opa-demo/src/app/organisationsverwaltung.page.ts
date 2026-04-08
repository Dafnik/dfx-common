import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';

import { DemoTokenService } from './demo-token.service';

@Component({
  template: `
    <section class="border border-sky-200 bg-sky-50/80 p-6 shadow-sm dark:border-sky-900 dark:bg-sky-950/40" hlmCard>
      <div hlmCardContent>
        <p class="text-sm font-medium tracking-[0.24em] text-sky-700 uppercase dark:text-sky-300">Guarded route</p>
        <h2 class="mt-2 text-3xl font-semibold">Organisationsverwaltung</h2>
        <p class="mt-3 max-w-2xl text-sm text-sky-900/80 dark:text-sky-100/80">
          This route is protected with
          <code>authzCanActivate</code>
          against
          <code>test/Organisationsverwaltung</code>
          . Only
          <code>ADMIN</code>
          can open it.
        </p>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <article class="rounded-xl border border-sky-200/80 bg-white/70 p-4 dark:border-sky-900/70 dark:bg-black/10">
            <h3 class="font-semibold">Current token</h3>
            <p class="mt-2 text-2xl font-semibold">{{ token() }}</p>
          </article>
          <article class="rounded-xl border border-sky-200/80 bg-white/70 p-4 dark:border-sky-900/70 dark:bg-black/10">
            <h3 class="font-semibold">Guard outcome</h3>
            <p class="mt-2 text-sm">Allowed by policy before the page component is activated.</p>
          </article>
        </div>

        <div class="mt-6">
          <a variant="link" hlmBtn routerLink="/kundenverwaltung">Compare with the broader Kundenverwaltung rule</a>
        </div>
      </div>
    </section>
  `,
  selector: 'app-organisationsverwaltung-page',
  imports: [RouterLink, HlmCardImports, HlmButton],
})
export class OrganisationsverwaltungPage {
  protected readonly token = inject(DemoTokenService).token;
}
