import { Injectable, inject, resource } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { PlaygroundCodeSnippetLanguage } from './code-snippet.model';

@Injectable({
  providedIn: 'root',
})
export class CodeHighlighterService {
  private readonly sanitizer = inject(DomSanitizer);

  private readonly codeHighlighter = resource({
    loader: createCodeHighlighter,
  });

  highlight(code: string, lang: PlaygroundCodeSnippetLanguage): SafeHtml | undefined {
    const codeHighlighter = this.codeHighlighter.value();

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
  }
}

async function createCodeHighlighter() {
  const [
    { createHighlighterCore },
    { createJavaScriptRegexEngine },
    { default: angularHtml },
    { default: angularTs },
    { default: json },
    { default: typescript },
    { default: githubLight },
    { default: githubDark },
  ] = await Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    import('@shikijs/langs/angular-html'),
    import('@shikijs/langs/angular-ts'),
    import('@shikijs/langs/json'),
    import('@shikijs/langs/typescript'),
    import('@shikijs/themes/github-light'),
    import('@shikijs/themes/github-dark'),
  ]);

  return createHighlighterCore({
    langs: [angularHtml, angularTs, json, typescript],
    themes: [githubLight, githubDark],
    engine: createJavaScriptRegexEngine(),
  });
}
