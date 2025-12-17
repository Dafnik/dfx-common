import { TestBed } from '@angular/core/testing';

import { TRANSLOCO_TRANSPILER, TranslocoTranspiler } from '@jsverse/transloco';

import { TranslationMarkupRendererFactory } from '../translation-markup-renderer-factory';
import { TranslationMarkupTranspilerContext } from '../translation-markup-transpiler.model';
import {
  InterpolationExpressionMatcher,
  StringInterpolationSegment,
  StringInterpolationTranspiler,
  TRANSLATION_INTERPOLATION_EXPRESSION_MATCHER,
  defaultTranslationInterpolationExpressionMatcherFactory,
} from './string-interpolation-transpiler';

class TestTranslocoTranspiler implements TranslocoTranspiler {
  public transpile(value: unknown): unknown {
    return value;
  }
}

describe('StringInterpolationTranspiler', () => {
  // Helper to configure the module for different matcher scenarios
  function configureTranspilerTest(matcher?: InterpolationExpressionMatcher) {
    TestBed.configureTestingModule({
      providers: [
        StringInterpolationTranspiler,
        TranslationMarkupRendererFactory,
        { provide: TRANSLOCO_TRANSPILER, useClass: TestTranslocoTranspiler },
        {
          provide: TRANSLATION_INTERPOLATION_EXPRESSION_MATCHER,
          useValue: matcher ?? defaultTranslationInterpolationExpressionMatcherFactory(),
        },
      ],
    });

    return {
      transpiler: TestBed.inject(StringInterpolationTranspiler),
      translocoTranspiler: TestBed.inject(TRANSLOCO_TRANSPILER),
    };
  }

  describe('tokenize function', () => {
    it('recognizes default Transloco interpolation expressions', () => {
      const { transpiler } = configureTranspilerTest();
      const translation = 'abc {{ def.ghi }} jkl {{ mnn }} {{ incomplete';

      const testCases = [
        { offset: 0, expectedToken: undefined },
        { offset: 1, expectedToken: undefined },
        { offset: 4, expectedToken: '{{ def.ghi }}' },
        { offset: 5, expectedToken: undefined },
        { offset: 22, expectedToken: '{{ mnn }}' },
        { offset: 23, expectedToken: undefined },
        { offset: 32, expectedToken: undefined },
      ];

      for (const { offset, expectedToken } of testCases) {
        const result = transpiler.tokenize(translation, offset);

        if (expectedToken) {
          expect(result).toBeDefined();
          expect(result!.nextOffset).toBe(offset + expectedToken.length);
          expect(result!.token instanceof StringInterpolationSegment).toBe(true);
          expect((result!.token as StringInterpolationSegment).interpolationExpression).toBe(expectedToken);
        } else {
          expect(result).toBeUndefined();
        }
      }
    });

    it('supports recognition of custom expressions', () => {
      const customMatcher: InterpolationExpressionMatcher = {
        matchExpression: (value: string, offset: number) => {
          if (!value.startsWith('$[', offset)) {
            return undefined;
          }
          const expressionEnd = value.indexOf(']', offset);
          return expressionEnd >= 2 ? expressionEnd + 1 - offset : undefined;
        },
      };

      const { transpiler } = configureTranspilerTest(customMatcher);
      const translation = 'abc {{ def.ghi }} jkl $[ mnn ]';

      const testCases = [
        { offset: 0, expectedToken: undefined },
        { offset: 4, expectedToken: undefined },
        { offset: 21, expectedToken: undefined },
        { offset: 22, expectedToken: '$[ mnn ]' },
        { offset: 23, expectedToken: undefined },
      ];

      for (const { offset, expectedToken } of testCases) {
        const result = transpiler.tokenize(translation, offset);

        if (expectedToken) {
          expect(result).toBeDefined();
          expect(result!.nextOffset).toBe(offset + expectedToken.length);
          expect(result!.token instanceof StringInterpolationSegment).toBe(true);
          expect((result!.token as StringInterpolationSegment).interpolationExpression).toBe(expectedToken);
        } else {
          expect(result).toBeUndefined();
        }
      }
    });
  });

  describe('transpile function', () => {
    it('returns undefined for unknown tokens', () => {
      const { transpiler } = configureTranspilerTest();
      const tokens = ['a', 'b', '{{', true, false, 4, undefined, { token: '{{' }, '}}'];
      const context = new TranslationMarkupTranspilerContext(tokens, {}, [transpiler]);

      for (const [offset] of tokens.entries()) {
        expect(transpiler.transpile(offset, context)).toBeUndefined();
      }
    });

    it('transpiles interpolation expressions', () => {
      const { transpiler } = configureTranspilerTest();
      const tokens = [
        new StringInterpolationSegment('{{ a }}'),
        new StringInterpolationSegment('{{ bcd.efg }}'),
        new StringInterpolationSegment('{{ xyz }}'),
      ];
      const context = new TranslationMarkupTranspilerContext(tokens, {}, [transpiler]);

      for (const [offset] of tokens.entries()) {
        const result = transpiler.transpile(offset, context);
        expect(result).toBeDefined();
        expect(result!.nextOffset).toBe(offset + 1);
      }
    });

    it('uses the transloco transpiler to expand interpolation expressions', () => {
      const { transpiler, translocoTranspiler } = configureTranspilerTest();
      const context = new TranslationMarkupTranspilerContext([new StringInterpolationSegment('{{ a }}')], {}, [transpiler]);

      const transpileSpy = vi.spyOn(translocoTranspiler, 'transpile').mockReturnValue('(expanded)');

      const transpileResult = transpiler.transpile(0, context);
      const renderTranslation = transpileResult!.renderer;
      const renderResult = renderTranslation({});

      expect(transpileSpy).toHaveBeenCalled();
      expect(transpileSpy.mock.calls[0][0].value).toBe('{{ a }}');

      expect(renderResult).toBeInstanceOf(Text);
      expect((renderResult as Text).textContent).toBe('(expanded)');
    });
  });
});
