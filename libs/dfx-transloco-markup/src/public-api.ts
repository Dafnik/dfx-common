/*
 * Public API Surface of dfx-transloco-markup
 */

export * from './lib/models/external-link.model';

export { BlockTranspiler } from './lib/transpilers/block-transpiler';
export { BoldTextTranspiler } from './lib/transpilers/bold-text-transpiler';
export { ContextualLinkBlockTranspiler } from './lib/transpilers/contextual-link-block-transpiler';
export { ContextualLinkSubstitutionTranspiler } from './lib/transpilers/contextual-link-substitution-transpiler';
export { ItalicTextTranspiler } from './lib/transpilers/italic-text-transpiler';
export { LinkTranspiler } from './lib/transpilers/link-transpiler';
export type { InterpolationExpressionMatcher } from './lib/transpilers/string-interpolation-transpiler';
export { TRANSLATION_INTERPOLATION_EXPRESSION_MATCHER } from './lib/transpilers/string-interpolation-transpiler';
export { SubstitutionTranspiler } from './lib/transpilers/substitution-transpiler';
export { ContextualLinkTranspilerFactory } from './lib/transpilers/contextual-link-transpiler-factory';

export type { HashMap } from './lib/utils/type.utils';

export { defaultTranslocoMarkupTranspilers } from './lib/default-transloco-markup-transpilers';
export { inheritTranslationMarkupTranspilers } from './lib/inherit-transpilers';
export * from './lib/link-renderer.model';
export { STRING_INTERPOLATION_TRANSPILER } from './lib/string-interpolation-transpiler.token';
export { TranslationMarkupRendererFactory } from './lib/translation-markup-renderer-factory';
export * from './lib/translation-markup-renderer.model';
export * from './lib/translation-markup-transpiler.model';
export * from './lib/translation-markup-transpiler.token';
export { TranslocoMarkupComponent } from './lib/transloco-markup.component';
export { TranslocoMarkupModule } from './lib/transloco-markup.module';
