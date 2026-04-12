import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';

import { provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCopy, lucideTerminal } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCard, HlmCardContent } from '@spartan-ng/helm/card';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';

import { Layout } from './layout';

@Component({
  template: `
    @let packageManagers = this.packageManagers();
    <section class="py-2" hlmCard>
      <div class="px-2" hlmCardContent>
        <hlm-tabs [tab]="selectedPackageManger()" (tabActivated)="selectedPackageManger.set($event)">
          <div class="flex items-center justify-between">
            <div class="overflow-x-auto overflow-y-hidden">
              <hlm-tabs-list class="h-auto rounded-none bg-transparent px-0 py-1" aria-label="tabs example">
                @for (pm of packageManagers; track pm.id) {
                  <button
                    class="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary! data-[state=active]:hover:bg-accent relative border-none px-3 py-2 after:absolute after:inset-x-0 after:-bottom-0.5! after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none! data-[state=active]:after:opacity-100 dark:data-[state=active]:bg-transparent"
                    [hlmTabsTrigger]="pm.id">
                    {{ pm.label }}
                  </button>
                }
              </hlm-tabs-list>
            </div>

            <div class="flex items-center gap-1.5 ps-1 pr-3">
              <span class="h-2.5 w-2.5 rounded-full bg-[#ff5f57]"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-[#febc2e]"></span>
              <span class="h-2.5 w-2.5 rounded-full bg-[#28c840]"></span>
            </div>
          </div>

          @for (pm of packageManagers; track pm.id) {
            <div [hlmTabsContent]="pm.id">
              <div class="bg-background flex items-center gap-3 rounded-md p-4 text-lg">
                <ng-icon class="text-blue-500" name="lucideTerminal" />

                <code class="flex-1 overflow-x-auto font-mono tracking-wide whitespace-nowrap">
                  <span class="text-muted-foreground me-1 select-none">$</span>
                  <span [innerHTML]="pm.installHTML"></span>
                </code>

                <button (click)="_copy(pm.install)" hlmBtn variant="outline" size="icon-sm" aria-label="Copy" title="Copy">
                  <ng-icon [name]="_isCopied() ? 'lucideCheck' : 'lucideCopy'" hlm size="sm" />
                </button>
              </div>
            </div>
          }
        </hlm-tabs>
      </div>
    </section>
  `,
  providers: [provideIcons({ lucideTerminal, lucideCopy, lucideCheck })],
  selector: 'playground-pm-install',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmCard, HlmCardContent, HlmTabsImports, HlmIconImports, HlmButton],
})
export class PackageManagerInstall {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly project = inject(Layout).project;
  readonly hasGenerator = input(false, { transform: booleanAttribute });

  readonly selectedPackageManger = linkedSignal(() => {
    const storagePm = this.isBrowser ? localStorage.getItem('selected_pm') : null;
    const pms = this.packageManagers();

    if (!storagePm || pms.find((it) => it.id === storagePm) === undefined) {
      return pms[0].id;
    }

    return storagePm;
  });

  protected readonly packageManagers = computed(() => {
    const pkg = this.project();

    const getPmPart = (it: string) => `<span class="text-blue-400">${it}</span>`;
    const getPackagePart = () => `<span class="text-green-500 dark:text-green-400">${pkg}</span>`;

    return [
      ...(this.hasGenerator()
        ? [
            {
              id: 'ng-add',
              label: 'ng add',
              install: `ng g ${pkg}:ng-add`,
              installHTML: `${getPmPart('ng g')} ${getPackagePart()}${getPmPart(':ng-add')}`,
            },
          ]
        : []),
      {
        id: 'pnpm',
        label: 'pnpm',
        install: `pnpm add ${pkg}`,
        installHTML: `${getPmPart('pnpm add')} ${getPackagePart()}`,
      },
      {
        id: 'npm',
        label: 'npm',
        install: `npm install ${pkg}`,
        installHTML: `${getPmPart('npm install')} ${getPackagePart()}`,
      },
      {
        id: 'yarn',
        label: 'yarn',
        install: `yarn add ${pkg}`,
        installHTML: `${getPmPart('yarn add')} ${getPackagePart()}`,
      },
      {
        id: 'bun',
        label: 'bun',
        install: `bun add ${pkg}`,
        installHTML: `${getPmPart('bun add')} ${getPackagePart()}`,
      },
    ];
  });

  protected readonly _isCopied = signal(false);

  constructor() {
    effect(() => {
      if (this.isBrowser) {
        localStorage.setItem('selected_pm', this.selectedPackageManger());
      }
    });
  }

  protected _copy(text: string) {
    void navigator.clipboard.writeText(text);
    this._isCopied.set(true);

    setTimeout(() => {
      this._isCopied.set(false);
    }, 2000);
  }
}
