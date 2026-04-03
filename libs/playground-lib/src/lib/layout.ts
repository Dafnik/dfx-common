import { Component, input } from '@angular/core';

@Component({
  template: `
    <div class="theme-bg-primary flex min-h-screen flex-col">
      <!-- Header -->
      <header class="theme-bg-primary sticky top-0 z-50" role="banner">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="flex h-16 items-center justify-between">
            <div class="flex items-center space-x-3">
              <h1 class="theme-text-primary text-lg font-semibold">{{ project() }}</h1>
            </div>

            <div role="navigation" aria-label="Main navigation">
              <ng-content select="nav" />
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1" role="main">
        <section class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div class="mx-auto mb-20 max-w-2xl text-center">
            <ng-content />
          </div>
        </section>
      </main>
    </div>
  `,
  selector: 'playground-layout',
})
export class Layout {
  project = input.required<string>();
}
