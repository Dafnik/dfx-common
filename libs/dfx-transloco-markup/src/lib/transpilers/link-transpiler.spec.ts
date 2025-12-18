import { TestBed } from '@angular/core/testing';

import { ExternalLinkObjectLinkRenderer, StringLinkRenderer } from '../default-link-renderers';
import { LinkRenderer } from '../link-renderer.model';
import { TranslationMarkupRendererFactory } from '../translation-markup-renderer-factory';
import { TranslationMarkupTranspilerContext } from '../translation-markup-transpiler.model';
import { LINK_END, LinkStart, LinkTranspiler } from './link-transpiler';

describe('LinkTranspiler', () => {
  function configureLinkTranspilerTest(linkRenderers: LinkRenderer<unknown> | LinkRenderer<unknown>[] | null = null) {
    const renderersArray = Array.isArray(linkRenderers) ? linkRenderers : linkRenderers ? [linkRenderers] : [];

    TestBed.configureTestingModule({
      providers: [LinkTranspiler, TranslationMarkupRendererFactory, { provide: LinkRenderer, useValue: renderersArray }],
    });

    return TestBed.inject(LinkTranspiler);
  }

  describe('tokenize function', () => {
    it('recognizes link blocks in translations', () => {
      const transpiler = configureLinkTranspilerTest();

      const translation = 'Click [link:cookieLink]here[/link] for cookies! Or [link:bakingCourseLink]learn[/link] to make your own.';

      const expectedTokens = [
        { offset: 6, length: 17, type: 'start', parameterKey: 'cookieLink' },
        { offset: 27, length: 7, type: 'end' },
        {
          offset: 51,
          length: 23,
          type: 'start',
          parameterKey: 'bakingCourseLink',
        },
        { offset: 79, length: 7, type: 'end' },
      ] as const;

      for (const [offset] of translation.split('').entries()) {
        const result = transpiler.tokenize(translation, offset);
        const expected = expectedTokens.find((t) => t.offset === offset);

        if (expected) {
          expect(result).toBeDefined();
          expect(result!.nextOffset).toBe(offset + expected.length);
          if (expected.type === 'start') {
            expect(result!.token).toBeInstanceOf(LinkStart);
            expect((result!.token as LinkStart).parameterKey).toBe(expected.parameterKey);
          } else {
            expect(result!.token).toBe(LINK_END);
          }
        } else {
          expect(result).toBeUndefined();
        }
      }
    });

    it('ignores invalid start and end tags', () => {
      const transpiler = configureLinkTranspilerTest();
      const translation = "Don't [/link you hate it [link:when";

      for (const [offset] of translation.split('').entries()) {
        const result = transpiler.tokenize(translation, offset);
        expect(result).toBeUndefined();
      }
    });
  });

  describe('transpile function', () => {
    it('returns undefined for unknown tokens', () => {
      const transpiler = configureLinkTranspilerTest();
      const tokens = [0, 'a', '<a>', '[link:abc]', ['link:abc'], true, false, null, undefined, {}];
      const context = new TranslationMarkupTranspilerContext(tokens, {}, [transpiler]);

      for (const [offset] of tokens.entries()) {
        expect(transpiler.transpile(offset, context)).toBeUndefined();
      }
    });

    it('returns a link renderer when transpiling supported token sequences', () => {
      const transpiler = configureLinkTranspilerTest();
      const tokens = [0, new LinkStart('abc'), 0, new LinkStart('def'), LINK_END, LINK_END, 0, new LinkStart('efg'), 0, LINK_END];
      const context = new TranslationMarkupTranspilerContext(tokens, {}, [transpiler]);

      const expectedResults = [0, 5, 0, 2, 0, 0, 0, 3, 0, 0];

      for (const [offset, expectedResult] of expectedResults.entries()) {
        const result = transpiler.transpile(offset, context);

        if (expectedResult === 0) {
          expect(result).toBeUndefined();
        } else {
          expect(result).toBeDefined();
          expect(result!.nextOffset).toBe(offset + expectedResult);
          expect(result!.renderer).toBeDefined();
        }
      }
    });

    it('uses the provided link renderers to render the links', () => {
      const stringLinkRenderer = new StringLinkRenderer();
      const externalLinkObjectLinkRenderer = new ExternalLinkObjectLinkRenderer();

      const renderStringLinkSpy = vi.spyOn(stringLinkRenderer, 'render');
      const renderExternalLinkObjectLinkSpy = vi.spyOn(externalLinkObjectLinkRenderer, 'render');

      const transpiler = configureLinkTranspilerTest([stringLinkRenderer, externalLinkObjectLinkRenderer]);
      const context = new TranslationMarkupTranspilerContext([new LinkStart('testLink'), LINK_END], {}, [transpiler]);

      const transpileResult = transpiler.transpile(0, context);
      const renderLink = transpileResult!.renderer;

      expect(renderStringLinkSpy).not.toHaveBeenCalled();
      expect(renderExternalLinkObjectLinkSpy).not.toHaveBeenCalled();

      renderLink({ testLink: 'https://www.example.com/' });
      expect(renderStringLinkSpy).toHaveBeenCalled();
      expect(renderExternalLinkObjectLinkSpy).not.toHaveBeenCalled();

      renderStringLinkSpy.mockClear();
      renderExternalLinkObjectLinkSpy.mockClear();

      renderLink({ testLink: { url: 'https://www.example.com/' } });
      expect(renderStringLinkSpy).not.toHaveBeenCalled();
      expect(renderExternalLinkObjectLinkSpy).toHaveBeenCalled();

      renderStringLinkSpy.mockClear();
      renderExternalLinkObjectLinkSpy.mockClear();

      renderLink({ testLink: { thisIs: 'not a supported link' } });
      expect(renderStringLinkSpy).not.toHaveBeenCalled();
      expect(renderExternalLinkObjectLinkSpy).not.toHaveBeenCalled();
    });
  });
});
