import { Injectable, inject } from '@angular/core';

import { TranslationMarkupRendererFactory } from '../translation-markup-renderer-factory';
import { TranslationMarkupRenderer } from '../translation-markup-renderer.model';
import { BlockTranspiler } from './block-transpiler';

/**
 * Transpiler that parses italic tags (`[i]...[/i]`) and creates a renderer that wraps the content in an HTML italic element (`<i>...</i>`).
 */
@Injectable()
export class ItalicTextTranspiler extends BlockTranspiler {
  /** Renderer factory which will be used for creating the HTML italic element renderer. */
  private readonly rendererFactory = inject(TranslationMarkupRendererFactory);

  /**
   * Creates an `ItalicTextTranspiler` instance that uses the specified renderer factory.
   */
  constructor() {
    super('[i]', '[/i]');
  }

  /** @inheritdoc */
  protected createRenderer(childRenderers: TranslationMarkupRenderer[]): TranslationMarkupRenderer {
    return this.rendererFactory.createElementRenderer('i', childRenderers);
  }
}
