import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  template: `
    <section class="border border-rose-200 bg-rose-50/80 p-6 shadow-sm dark:border-rose-900 dark:bg-rose-950/40" hlmCard>
      <div hlmCardContent>
        <p class="text-sm font-medium tracking-[0.24em] text-rose-700 uppercase dark:text-rose-300">Access denied</p>
        <h2 class="mt-2 text-3xl font-semibold">Navigation was blocked</h2>
        <p class="mt-3 max-w-2xl text-sm text-rose-900/80 dark:text-rose-100/80">
          The guard redirected here before activating the target page. Change the shared token in the shell and try the route again.
        </p>

        <dl class="mt-6 grid gap-4 md:grid-cols-2">
          <div class="rounded-xl border border-rose-200/80 bg-white/70 p-4 dark:border-rose-900/70 dark:bg-black/10">
            <dt class="text-sm font-medium">Attempted route</dt>
            <dd class="mt-2 text-sm">{{ from() }}</dd>
          </div>
          <div class="rounded-xl border border-rose-200/80 bg-white/70 p-4 dark:border-rose-900/70 dark:bg-black/10">
            <dt class="text-sm font-medium">Policy</dt>
            <dd class="mt-2 text-sm">{{ policy() }}</dd>
          </div>
          <div class="rounded-xl border border-rose-200/80 bg-white/70 p-4 dark:border-rose-900/70 dark:bg-black/10">
            <dt class="text-sm font-medium">Reason</dt>
            <dd class="mt-2 text-sm">{{ reasonLabel() }}</dd>
          </div>
        </dl>

        <div class="mt-6 flex flex-wrap gap-3">
          <a class="rounded-full" hlmBtn routerLink="/">Back to home</a>
          <a class="rounded-full" hlmBtn variant="secondary" routerLink="/organisationsverwaltung">Retry {{ from() }}</a>
        </div>
      </div>
    </section>
  `,
  selector: 'app-access-denied-page',
  imports: [RouterLink, HlmCardImports, HlmButton],
})
export class AccessDeniedPage {
  private readonly route = inject(ActivatedRoute);

  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly from = computed(() => this.queryParamMap().get('from') ?? '(unknown)');
  protected readonly policy = computed(() => this.queryParamMap().get('policy') ?? '(unknown)');
  protected readonly reason = computed(() => this.queryParamMap().get('reason') ?? 'denied');
  protected readonly reasonLabel = computed(() => {
    const reason = this.reason();

    if (reason === 'error') {
      return 'Authorization request failed';
    }

    return 'Policy denied access';
  });
}
