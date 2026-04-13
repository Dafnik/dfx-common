import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TranslocoModule } from '@jsverse/transloco';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { TranslocoMarkupComponent, inheritTranslationMarkupTranspilers, provideTranslationMarkupTranspiler } from 'dfx-transloco-markup';
import { PlaygroundCodeSnippetFile, PlaygroundCodeSnippets } from 'playground-lib';

import { defineTranslationKeys } from '../../define-translation-keys';
import { ColoredTextTranspiler } from './colored-text-transpiler';
import { EmoticonTranspiler } from './emoticon-transpiler';

export const CUSTOM_TRANSPILERS_TRANSLATION_KEYS = defineTranslationKeys((t) => ({
  CUSTOM_TRANSPILERS: {
    TITLE: t,
    MESSAGE: t,
  },
})).CUSTOM_TRANSPILERS;

@Component({
  template: `
    <section hlmCard>
      <div hlmCardHeader>
        <h3 hlmCardTitle>{{ TRANSLATIONS.TITLE | transloco }}</h3>
      </div>
      <div hlmCardContent>
        <transloco [key]="TRANSLATIONS.MESSAGE"></transloco>

        <div class="mt-6 min-w-px text-left">
          <playground-code-snippets [files]="codeSnippets" />
        </div>
      </div>
    </section>
  `,
  selector: 'custom-transpiler-feature',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslocoModule, TranslocoMarkupComponent, FormsModule, HlmCardImports, PlaygroundCodeSnippets],
  providers: [
    provideTranslationMarkupTranspiler(EmoticonTranspiler),
    provideTranslationMarkupTranspiler(ColoredTextTranspiler),
    inheritTranslationMarkupTranspilers(),
  ],
})
export class CustomTranspilersFeatureComponent {
  public readonly TRANSLATIONS = CUSTOM_TRANSPILERS_TRANSLATION_KEYS;

  protected readonly codeSnippets: PlaygroundCodeSnippetFile[] = [
    {
      id: 'component',
      filename: 'custom-transpilers-feature.component.ts',
      lang: 'angular-ts',
      code: String.raw`import { Component } from '@angular/core';

import { TranslocoMarkupComponent, inheritTranslationMarkupTranspilers, provideTranslationMarkupTranspiler } from 'dfx-transloco-markup';

import { ColoredTextTranspiler } from './colored-text-transpiler';
import { EmoticonTranspiler } from './emoticon-transpiler';

@Component({
  selector: 'custom-transpiler-feature',
  imports: [TranslocoMarkupComponent],
  template: '<transloco [key]="TRANSLATIONS.MESSAGE"/>',
  providers: [
    provideTranslationMarkupTranspiler(EmoticonTranspiler),
    provideTranslationMarkupTranspiler(ColoredTextTranspiler),
    inheritTranslationMarkupTranspilers(),
  ],
})
export class CustomTranspilersFeatureComponent {
  protected readonly TRANSLATIONS = CUSTOM_TRANSPILERS_TRANSLATION_KEYS;
}`,
    },
    {
      id: 'transpiler',
      filename: 'colored-text-transpiler.ts',
      lang: 'typescript',
      code: String.raw`import { Injectable, inject } from '@angular/core';

import {
  HashMap,
  TokenizeResult,
  TranslationMarkupRenderer,
  TranslationMarkupRendererFactory,
  TranslationMarkupTranspiler,
  TranslationMarkupTranspilerContext,
  TranspileResult,
} from 'dfx-transloco-markup';

@Injectable()
export class ColoredTextTranspiler implements TranslationMarkupTranspiler {
  private readonly rendererFactory = inject(TranslationMarkupRendererFactory);

  public tokenize(translation: string, offset: number): TokenizeResult | undefined {
    return recognizeColorStartToken(translation, offset) ?? recognizeColorEndToken(translation, offset);
  }

  public transpile(start: number, context: TranslationMarkupTranspilerContext): TranspileResult | undefined {
    const nextToken = context.tokens[start];

    if (!(nextToken instanceof ColorStart)) {
      return undefined;
    }

    const { nextOffset, renderers } = context.transpileUntil(start + 1, (token) => token === COLOR_END);

    return {
      nextOffset: Math.min(nextOffset + 1, context.tokens.length),
      renderer: this.createRenderer(nextToken.cssColorValue, renderers),
    };
  }

  private createRenderer(cssColorValue: string, childRenderers: TranslationMarkupRenderer[]): TranslationMarkupRenderer {
    const spanRenderer = this.rendererFactory.createElementRenderer('span', childRenderers);

    function renderColorMarkup(translationParameters: HashMap): HTMLSpanElement {
      const spanElement = spanRenderer(translationParameters);

      spanElement.style.color = cssColorValue;

      return spanElement;
    }

    return renderColorMarkup;
  }
}

function recognizeColorStartToken(translation: string, offset: number): TokenizeResult | undefined {
  const COLOR_START_TOKEN = '[c:';

  if (!translation.startsWith(COLOR_START_TOKEN, offset)) {
    return undefined;
  }

  const end = translation.indexOf(']', offset + COLOR_START_TOKEN.length);

  if (end < 0) {
    return undefined;
  }

  const cssColorValue = translation.substring(offset + COLOR_START_TOKEN.length, end);

  return {
    nextOffset: end + 1,
    token: new ColorStart(cssColorValue),
  };
}

function recognizeColorEndToken(translation: string, offset: number): TokenizeResult | undefined {
  const COLOR_END_TOKEN = '[/c]';

  if (!translation.startsWith(COLOR_END_TOKEN, offset)) {
    return undefined;
  }

  return {
    nextOffset: offset + COLOR_END_TOKEN.length,
    token: COLOR_END,
  };
}

class ColorStart {
  constructor(public readonly cssColorValue: string) {}
}

const COLOR_END = new (class ColorEnd {})();`,
    },
    {
      id: 'emoticon-transpiler',
      filename: 'emoticon-transpiler.ts',
      lang: 'typescript',
      code: String.raw`import { Injectable, inject } from '@angular/core';

import {
  TokenizeResult,
  TranslationMarkupRendererFactory,
  TranslationMarkupTranspiler,
  TranslationMarkupTranspilerContext,
  TranspileResult,
} from 'dfx-transloco-markup';

const EMOTICON_MAP = new Map<string, string>([
  [':)', '\u{1F642}'],
  [':D', '\u{1F600}'],
  [';)', '\u{1F609}'],
  ['xD', '\u{1F606}'],
  ['XD', '\u{1F606}'],
  ['B)', '\u{1F60E}'],
  [':|', '\u{1F610}'],
  [':(', '\u{1F641}'],
  ['>:(', '\u{1F620}'],
]);

@Injectable()
export class EmoticonTranspiler implements TranslationMarkupTranspiler {
  private readonly translationMarkupRendererFactory = inject(TranslationMarkupRendererFactory);

  public tokenize(translation: string, offset: number): TokenizeResult | undefined {
    for (const [key, value] of EMOTICON_MAP) {
      if (translation.startsWith(key, offset)) {
        return {
          token: new Emoticon(value),
          nextOffset: offset + key.length,
        };
      }
    }

    return undefined;
  }

  public transpile(offset: number, { tokens }: TranslationMarkupTranspilerContext): TranspileResult | undefined {
    const nextToken = tokens[offset];

    if (!(nextToken instanceof Emoticon)) {
      return undefined;
    }

    return {
      nextOffset: offset + 1,
      renderer: this.translationMarkupRendererFactory.createTextRenderer(nextToken.value),
    };
  }
}

class Emoticon {
  constructor(public readonly value: string) {}
}`,
    },
    {
      id: 'translations',
      filename: 'en.json',
      lang: 'json',
      code: String.raw`{
  "CUSTOM_TRANSPILERS": {
    "MESSAGE": "This an example message that uses [b][c:dodgerblue]custom ([i]non-standard[/i])[/c] [c:deepskyblue]transpilers[/b][/c]! :)",
    "TITLE": "Custom transpilers"
  }
}`,
    },
  ];
}
