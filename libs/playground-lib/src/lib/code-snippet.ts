import { ChangeDetectionStrategy, Component, DestroyRef, Injectable, computed, inject, input, resource, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCopy } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmIconImports } from '@spartan-ng/helm/icon';

export type PlaygroundCodeSnippetLanguage = 'angular-html' | 'typescript';

@Injectable({
  providedIn: 'root',
})
class CodeHighlighterService {
  codeHighLighter = resource({
    loader: createCodeHighlighter,
  });
}

async function createCodeHighlighter() {
  const [
    { createHighlighterCore },
    { createJavaScriptRegexEngine },
    { default: angularHtml },
    { default: typescript },
    { default: githubLight },
    { default: githubDark },
  ] = await Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    import('@shikijs/langs/angular-html'),
    import('@shikijs/langs/typescript'),
    import('@shikijs/themes/github-light'),
    import('@shikijs/themes/github-dark'),
  ]);

  return createHighlighterCore({
    langs: [angularHtml, typescript],
    themes: [githubLight, githubDark],
    engine: createJavaScriptRegexEngine(),
  });
}

@Component({
  selector: 'playground-code-snippet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'playground-code-snippet block',
  },
  template: `
    <div class="border-border bg-card text-card-foreground overflow-hidden rounded-md border">
      <div class="border-border bg-muted/40 sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-3 py-2">
        <h6 class="text-foreground text-sm font-semibold">{{ label() }}</h6>
        <button
          [attr.aria-label]="'Copy ' + label() + ' code'"
          [attr.data-copied]="copied()"
          [title]="'Copy ' + label() + ' code'"
          (click)="copyCode()"
          hlmBtn
          variant="outline"
          size="icon-sm"
          type="button">
          <ng-icon [name]="copied() ? 'lucideCheck' : 'lucideCopy'" hlm size="sm" />
        </button>
      </div>

      @if (highlightedCode(); as highlighted) {
        <div [innerHTML]="highlighted"></div>
      } @else {
        <pre class="bg-muted/20 text-foreground m-0 max-h-96 overflow-auto p-4 text-sm leading-relaxed"><code>{{ code() }}</code></pre>
      }
    </div>
  `,
  providers: [provideIcons({ lucideCheck, lucideCopy })],
  imports: [HlmButton, HlmIconImports],
})
export class PlaygroundCodeSnippet {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly codeHighlighterService = inject(CodeHighlighterService);

  readonly label = input.required<string>();
  readonly code = input.required<string>();
  readonly lang = input.required<PlaygroundCodeSnippetLanguage>();

  protected readonly copied = signal(false);
  protected readonly highlightedCode = computed(() => {
    const code = this.code();
    const lang = this.lang();
    const codeHighlighter = this.codeHighlighterService.codeHighLighter.value();

    if (!codeHighlighter) {
      return undefined;
    }

    const highlighted = codeHighlighter.codeToHtml(code, {
      lang,
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    });

    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  });

  private copyResetTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.copyResetTimeout) {
        clearTimeout(this.copyResetTimeout);
      }
    });
  }

  protected copyCode(): void {
    void navigator.clipboard?.writeText(this.code());
    this.copied.set(true);

    if (this.copyResetTimeout) {
      clearTimeout(this.copyResetTimeout);
    }

    this.copyResetTimeout = setTimeout(() => {
      this.copied.set(false);
      this.copyResetTimeout = undefined;
    }, 2000);
  }
}
