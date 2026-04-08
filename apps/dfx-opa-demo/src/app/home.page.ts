import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { AuthzDirective, useAuthz } from 'dfx-opa';

import { DemoTokenService } from './demo-token.service';

@Component({
  template: `
    <div class="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
      <section>
        <p class="text-sm font-medium tracking-[0.24em] text-neutral-500 uppercase">Directive demo</p>
        <h2 class="mt-2 text-2xl font-semibold">Template access checks</h2>
        <p class="mt-3 text-sm text-neutral-600 dark:text-neutral-300">
          The shared token in the app shell flows through
          <code>provideAuthz()</code>
          as
          <code>defaultInput</code>
          .
        </p>

        <div class="mt-6 grid gap-4 md:grid-cols-2">
          <article hlmCard>
            <div hlmCardHeader>
              <h3 hlmCardTitle>Organisationsverwaltung</h3>
            </div>
            <div hlmCardContent>
              <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                Requires
                <code>ADMIN</code>
                .
              </p>
              <div class="mt-4">
                <ng-container *authz="'test/Organisationsverwaltung'; loading: organisationsLoading; else: organisationsDenied">
                  <p class="text-sm font-medium text-green-600">Access allowed</p>
                </ng-container>
                <ng-template #organisationsLoading>
                  <p class="text-sm text-neutral-500">Loading policy result...</p>
                </ng-template>
                <ng-template #organisationsDenied>
                  <p class="text-sm font-medium text-red-600">Access denied</p>
                </ng-template>
              </div>
            </div>
          </article>

          <article hlmCard>
            <div hlmCardHeader>
              <h3 hlmCardTitle>Kundenverwaltung</h3>
            </div>
            <div hlmCardContent>
              <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                Allows
                <code>ADMIN</code>
                and
                <code>MODERATOR</code>
                .
              </p>
              <div class="mt-4">
                <ng-container *authz="'test/Kundenverwaltung'; loading: kundenLoading; else: kundenDenied">
                  <p class="text-sm font-medium text-green-600">Access allowed</p>
                </ng-container>
                <ng-template #kundenLoading>
                  <p class="text-sm text-neutral-500">Loading policy result...</p>
                </ng-template>
                <ng-template #kundenDenied>
                  <p class="text-sm font-medium text-red-600">Access denied</p>
                </ng-template>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="mt-12">
        <p class="text-sm font-medium tracking-[0.24em] text-neutral-500 uppercase">Hook demo</p>
        <h2 class="mt-2 text-2xl font-semibold">Interactive useAuthz playground</h2>

        <div hlmField>
          <label hlmFieldLabel for="testPath">Policy path</label>

          <hlm-select id="testPath" [(ngModel)]="testPath">
            <hlm-select-trigger class="w-full">
              <hlm-select-value placeholder="Select a fruit" />
            </hlm-select-trigger>
            <hlm-select-content *hlmSelectPortal>
              <hlm-select-group>
                <hlm-select-label>Roles</hlm-select-label>
                <hlm-select-item value="test/Organisationsverwaltung">test/Organisationsverwaltung</hlm-select-item>
                <hlm-select-item value="test/Kundenverwaltung">test/Kundenverwaltung</hlm-select-item>
              </hlm-select-group>
            </hlm-select-content>
          </hlm-select>
        </div>

        <div class="mt-6" hlmField>
          <label hlmFieldLabel for="testToken">Local override token</label>

          <hlm-select id="testToken" [(ngModel)]="testToken">
            <hlm-select-trigger class="w-full">
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

        <hr class="my-8" />

        <dl class="space-y-2 text-sm">
          <div class="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
            <dt class="font-medium">Result</dt>
            <dd>{{ useAuthzTest.value() }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
            <dt class="font-medium">Error</dt>
            <dd>{{ useAuthzTest.error() }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
            <dt class="font-medium">Loading</dt>
            <dd>{{ useAuthzTest.isLoading() }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2 dark:border-neutral-800">
            <dt class="font-medium">Shell token</dt>
            <dd>{{ globalToken() }}</dd>
          </div>
        </dl>
      </section>
    </div>
  `,

  selector: 'app-home-page',
  imports: [AuthzDirective, FormsModule, HlmFieldImports, HlmSelectImports, HlmCardImports],
})
export class HomePage {
  protected readonly globalToken = inject(DemoTokenService).token;

  protected readonly testPath = signal('test/Organisationsverwaltung');
  protected readonly testToken = signal('ADMIN');

  protected readonly useAuthzTest = useAuthz<boolean>({
    path: this.testPath,
    input: computed(() => ({ token: this.testToken() })),
  });
}
