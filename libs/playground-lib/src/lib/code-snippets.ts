import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, linkedSignal, signal } from '@angular/core';

import { provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCopy, lucideFileCode } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCard, HlmCardContent } from '@spartan-ng/helm/card';
import { HlmIconImports } from '@spartan-ng/helm/icon';
import { HlmTabsImports } from '@spartan-ng/helm/tabs';

import { CodeHighlighterService } from './code-highlighter';
import { PlaygroundCodeSnippetFile } from './code-snippet.model';

export type { PlaygroundCodeSnippetFile } from './code-snippet.model';

@Component({
  selector: 'playground-code-snippets',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'playground-code-snippet playground-code-snippets block',
  },
  template: `
    @let files = this.files();

    @if (files.length > 0) {
      @let activeFile = this.activeFile();

      <section class="overflow-hidden py-0" hlmCard>
        <div class="px-0 pb-0" hlmCardContent>
          <hlm-tabs class="block" [tab]="activeFile.id" (tabActivated)="activeFileId.set($event)">
            <div class="flex items-center justify-between px-2 pt-2">
              <div class="flex-1 overflow-x-auto overflow-y-hidden">
                <hlm-tabs-list class="h-auto rounded-none bg-transparent px-0 py-1" aria-label="Code files">
                  @for (file of files; track file.id) {
                    <button
                      class="hover:bg-accent hover:text-foreground data-[state=active]:after:bg-primary! data-[state=active]:hover:bg-accent relative border-none px-3 py-2 whitespace-nowrap after:absolute after:inset-x-0 after:-bottom-0.5! after:-mb-1 after:h-0.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none! data-[state=active]:after:opacity-100 dark:data-[state=active]:bg-transparent"
                      [hlmTabsTrigger]="file.id">
                      {{ file.label }}
                    </button>
                  }
                </hlm-tabs-list>
              </div>

              <div class="flex shrink-0 items-center gap-1.5 ps-1 pr-3">
                <span class="h-2.5 w-2.5 rounded-full bg-[#ff5f57]"></span>
                <span class="h-2.5 w-2.5 rounded-full bg-[#febc2e]"></span>
                <span class="h-2.5 w-2.5 rounded-full bg-[#28c840]"></span>
              </div>
            </div>

            @for (file of files; track file.id) {
              <div [hlmTabsContent]="file.id">
                @if (file.id === activeFile.id) {
                  <div class="border-border bg-card text-card-foreground overflow-hidden rounded-md border">
                    <div class="border-border bg-muted/40 sticky top-0 z-10 flex items-center justify-between gap-3 border-b">
                      <div class="flex flex-1 items-center gap-2">
                        <ng-icon class="text-blue-500" name="lucideFileCode" hlm size="sm" />
                        <h6 class="text-foreground truncate text-sm font-semibold">{{ file.filename }}</h6>
                      </div>

                      <button
                        class="shrink-0"
                        [attr.aria-label]="'Copy ' + file.filename + ' code'"
                        [attr.data-copied]="copiedFileId() === file.id"
                        [title]="'Copy ' + file.filename + ' code'"
                        (click)="copyCode(file)"
                        hlmBtn
                        variant="outline"
                        size="icon-sm"
                        type="button">
                        <ng-icon [name]="copiedFileId() === file.id ? 'lucideCheck' : 'lucideCopy'" hlm size="sm" />
                      </button>
                    </div>

                    @if (highlightedCode(); as highlighted) {
                      <div [innerHTML]="highlighted"></div>
                    } @else {
                      <pre
                        class="bg-muted/20 text-foreground m-0 max-h-96 max-w-full overflow-auto p-0 text-sm leading-relaxed"><code>{{ file.code }}</code></pre>
                    }
                  </div>
                }
              </div>
            }
          </hlm-tabs>
        </div>
      </section>
    }
  `,
  providers: [provideIcons({ lucideCheck, lucideCopy, lucideFileCode })],
  imports: [HlmCard, HlmCardContent, HlmTabsImports, HlmIconImports, HlmButton],
})
export class PlaygroundCodeSnippets {
  private readonly destroyRef = inject(DestroyRef);
  private readonly codeHighlighterService = inject(CodeHighlighterService);

  readonly files = input.required<PlaygroundCodeSnippetFile[]>();

  protected readonly activeFileId = linkedSignal(() => this.files()[0]?.id ?? '');
  protected readonly activeFile = computed(() => {
    const files = this.files();
    return files.find((file) => file.id === this.activeFileId()) ?? files[0];
  });
  protected readonly highlightedCode = computed(() => {
    const activeFile = this.activeFile();

    if (!activeFile) {
      return undefined;
    }

    return this.codeHighlighterService.highlight(activeFile.code, activeFile.lang);
  });
  protected readonly copiedFileId = signal<string | undefined>(undefined);

  private copyResetTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.copyResetTimeout) {
        clearTimeout(this.copyResetTimeout);
      }
    });
  }

  protected copyCode(file: PlaygroundCodeSnippetFile): void {
    void navigator.clipboard?.writeText(file.code);
    this.copiedFileId.set(file.id);

    if (this.copyResetTimeout) {
      clearTimeout(this.copyResetTimeout);
    }

    this.copyResetTimeout = setTimeout(() => {
      this.copiedFileId.set(undefined);
      this.copyResetTimeout = undefined;
    }, 2000);
  }
}
