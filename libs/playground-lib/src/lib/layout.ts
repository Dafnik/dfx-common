import { Component, HostListener, input, signal } from '@angular/core';

@Component({
  template: `
    <div class="flex min-h-screen flex-col">
      <!-- Header -->
      <header
        class="sticky top-0 z-50 transition-all duration-200 data-[scrolled=true]:border-b data-[scrolled=true]:border-black/10 data-[scrolled=true]:bg-white/55 data-[scrolled=true]:shadow-sm data-[scrolled=true]:backdrop-blur-xl dark:data-[scrolled=true]:border-white/10 dark:data-[scrolled=true]:bg-black/55"
        [attr.data-scrolled]="isScrolled()"
        role="banner">
        <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div class="flex h-16 items-center justify-between">
            <div class="flex items-center space-x-3">
              <h1 class="text-lg font-semibold">{{ project() }}</h1>
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
          <div class="mx-auto mt-4 mb-20 max-w-2xl">
            <ng-content />
          </div>
        </section>
      </main>
    </div>
  `,
  selector: 'playground-layout',
})
export class Layout {
  protected readonly isScrolled = signal(false);

  readonly project = input.required<string>();

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 8);
  }
}
