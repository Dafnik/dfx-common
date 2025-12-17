import { TestBed } from '@angular/core/testing';

import { TranslationMarkupRendererFactory } from '../translation-markup-renderer-factory';
import { TranslationMarkupTranspilerContext } from '../translation-markup-transpiler.model';
import { StringLiteralTranspiler } from './string-literal-transpiler';

describe('StringLiteralTranspiler', () => {
  describe('tokenize function', () => {
    it('recognizes every character as a valid token', () => {
      const transpiler = TestBed.inject(StringLiteralTranspiler);

      const translation = '[b]example {{ translation }} text[/b]!';

      for (const [offset, expectedToken] of translation.split('').entries()) {
        const result = transpiler.tokenize(translation, offset);

        expect(result, `expected tokenize('${translation}', ${offset}) to return a token`).toBeDefined();
        expect(result!.token, `expected tokenize('${translation}', ${offset}).token to be '${expectedToken}'`).toBe(expectedToken);
        expect(result!.nextOffset, `expected tokenize('${translation}', ${offset}).nextOffset to be '${offset + 1}'`).toBe(offset + 1);
      }
    });
  });

  describe('transpile function', () => {
    it('returns undefined for unknown tokens', () => {
      const transpiler = TestBed.inject(StringLiteralTranspiler);

      const tokens = [1, null, undefined, false, true, [], {}];
      const context = new TranslationMarkupTranspilerContext(tokens, {}, [transpiler]);

      for (const [offset] of tokens.entries()) {
        expect(transpiler.transpile(offset, context)).toBeUndefined();
      }
    });

    it('transpiles sequences of character tokens', () => {
      const renderFactory = TestBed.inject(TranslationMarkupRendererFactory);
      const transpiler = TestBed.inject(StringLiteralTranspiler);

      const tokens = [0, 'a', 1, 'b', 'c', 'd', 2, 'e'];
      const context = new TranslationMarkupTranspilerContext(tokens, {}, [transpiler]);
      const expectedResults = [undefined, 'a', undefined, 'bcd', 'cd', 'd', undefined, 'e'];

      const renderTextSpy = vi.spyOn(renderFactory, 'createTextRenderer');

      for (const [offset, expectedResult] of expectedResults.entries()) {
        renderTextSpy.mockClear();

        const result = transpiler.transpile(offset, context);

        if (expectedResult === undefined) {
          expect(result, `expected transpile(tokens, ${offset}, context) to return undefined`).toBeUndefined();
          expect(renderTextSpy).not.toHaveBeenCalled();
        } else {
          expect(result, `expected transpile(tokens, ${offset}, context) to return a parse result`).toBeDefined();
          expect(result!.nextOffset).toBe(offset + expectedResult.length);
          expect(renderTextSpy).toHaveBeenCalledWith(expectedResult);
        }
      }
    });
  });
});
