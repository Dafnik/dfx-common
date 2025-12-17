import { ComponentFixture, TestBed } from '@angular/core/testing';

import { of } from 'rxjs';

import {
  TRANSLOCO_LOADER,
  TRANSLOCO_MISSING_HANDLER,
  TRANSLOCO_SCOPE,
  TestingLoader,
  TranslocoConfig,
  TranslocoMissingHandler,
  TranslocoService,
  TranslocoTestingModule,
  translocoConfig,
} from '@jsverse/transloco';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultTranslocoMarkupTranspilers } from './default-transloco-markup-transpilers';
import {
  TokenizeResult,
  TranslationMarkupTranspiler,
  TranslationMarkupTranspilerContext,
  TranspileResult,
} from './translation-markup-transpiler.model';
import { TranslocoMarkupComponent } from './transloco-markup.component';
import { tickAsync } from './utils/tick-async.spec';

const TRANSLATIONS = {
  en: {
    TITLE: 'Welcome to [b]Transloco [i]Markup[/i][/b]',
    EMPTY: '',
    CALL_TO_ACTION: 'Click [link:presents]here[/link] for some [b]awesome presents[/b] provided by [i]{{ name }}[/i]',
  },
  nl: {
    TITLE: 'Welkom bij [b]Transloco [i]Markup[/i][/b]',
    EMPTY: '',
    CALL_TO_ACTION: 'Klik [link:presents]hier[/link] voor [b]geweldige cadeautjes[/b] geleverd door [i]{{ name }}[/i]',
  },
  l33t: {
    TITLE: 'W31c0m3 70 [b]7r4n5l0c0 [i]M4rkup[/i][/b]',
    EMPTY: '',
    CALL_TO_ACTION: 'cl1ck [link:presents]h3r3[/link] f0r 50m3 [b]4w350m3 pr353n75[/b] pr0v1d3d by [i]{{ name }}[/i]',
    SECRET: 'b335 m4k3 h0n3y',
  },
};

type PartialTranslocoConfig = Parameters<typeof translocoConfig>[0];

function createTestTranslocoConfig(overrides: PartialTranslocoConfig = {}): TranslocoConfig {
  return translocoConfig({
    availableLangs: Object.keys(TRANSLATIONS),
    defaultLang: Object.keys(TRANSLATIONS)[0],
    prodMode: true,
    missingHandler: { logMissingKey: false },
    ...overrides,
  });
}

describe('Transloco markup component', () => {
  let component: TranslocoMarkupComponent;
  let fixture: ComponentFixture<TranslocoMarkupComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoMarkupComponent,
        TranslocoTestingModule.forRoot({
          translocoConfig: createTestTranslocoConfig(),
          langs: TRANSLATIONS,
        }),
      ],
      providers: [defaultTranslocoMarkupTranspilers(), { provide: TRANSLOCO_SCOPE, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslocoMarkupComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it('can render translations with markup', () => {
    component.translationKey = 'TITLE';
    fixture.detectChanges();

    expect(component).toBeDefined();
    expect(element.textContent).toBe('Welcome to Transloco Markup');
    expect(element.querySelector('b')).toBeDefined();
    expect(element.querySelector('b')!.textContent).toBe('Transloco Markup');
    expect(element.querySelector('i')).toBeDefined();
    expect(element.querySelector('i')!.textContent).toBe('Markup');
  });

  it('can render a pre translated text with markup', () => {
    component.content = 'Styled [i]text[/i]';
    fixture.detectChanges();

    expect(component).toBeDefined();
    expect(element.textContent).toBe('Styled text');
    expect(element.querySelector('i')).toBeDefined();
    expect(element.querySelector('i')!.textContent).toBe('text');
  });

  it('ignores the `content` property if a translation key is specified', () => {
    component.translationKey = 'TITLE';
    component.content = 'Something else';
    fixture.detectChanges();

    expect(component).toBeDefined();
    expect(element.textContent).toBe('Welcome to Transloco Markup');
  });

  it('renders an empty element when no translation key and content are specified', () => {
    fixture.detectChanges();

    expect(element.firstChild).toBeNull();
  });

  it('supports inline language specification', () => {
    component.translationKey = 'TITLE';
    component.inlineLanguage = 'nl';
    fixture.detectChanges();

    expect(element.textContent).toBe('Welkom bij Transloco Markup');
    expect(element.querySelector('b')).toBeDefined();
    expect(element.querySelector('i')).toBeDefined();
  });

  it('renders the translation when the inline language specification changes', () => {
    component.translationKey = 'TITLE';
    fixture.detectChanges();

    expect(element.textContent).toBe('Welcome to Transloco Markup');
    expect(element.querySelector('b')).toBeDefined();
    expect(element.querySelector('i')).toBeDefined();

    component.inlineLanguage = 'nl';
    fixture.detectChanges();

    expect(element.textContent).toBe('Welkom bij Transloco Markup');
    expect(element.querySelector('b')).toBeDefined();
    expect(element.querySelector('i')).toBeDefined();

    component.inlineLanguage = 'l33t';
    fixture.detectChanges();

    expect(element.textContent).toBe('W31c0m3 70 7r4n5l0c0 M4rkup');
    expect(element.querySelector('b')).toBeDefined();
    expect(element.querySelector('i')).toBeDefined();
  });

  it('will rerender when the language is changed via the `TranslocoService` and the reRenderOnLangChange option is enabled', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        TranslocoMarkupComponent,
        TranslocoTestingModule.forRoot({
          translocoConfig: createTestTranslocoConfig({
            reRenderOnLangChange: true,
          }),
          langs: TRANSLATIONS,
        }),
      ],
      providers: [defaultTranslocoMarkupTranspilers(), { provide: TRANSLOCO_SCOPE, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslocoMarkupComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    component.translationKey = 'TITLE';
    fixture.detectChanges();

    const translocoService = TestBed.inject(TranslocoService);

    expect(element.textContent).toBe('Welcome to Transloco Markup');

    translocoService.setActiveLang('nl');
    fixture.detectChanges();

    expect(element.textContent).toBe('Welkom bij Transloco Markup');
  });

  it('will not rerender when the language is changed via the `TranslocoService` and the reRenderOnLangChange option is disabled', () => {
    component.translationKey = 'TITLE';
    fixture.detectChanges();

    const translocoService = TestBed.inject(TranslocoService);

    expect(element.textContent).toBe('Welcome to Transloco Markup');

    translocoService.setActiveLang('nl');
    fixture.detectChanges();

    expect(element.textContent).toBe('Welcome to Transloco Markup');
  });

  it('ignores the language changes of the `TranslocoService` when a static inline language is specified', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        TranslocoMarkupComponent,
        TranslocoTestingModule.forRoot({
          translocoConfig: createTestTranslocoConfig({
            reRenderOnLangChange: true,
          }),
          langs: TRANSLATIONS,
        }),
      ],
      providers: [defaultTranslocoMarkupTranspilers(), { provide: TRANSLOCO_SCOPE, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslocoMarkupComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    component.translationKey = 'TITLE';
    component.inlineLanguage = 'l33t|static';
    fixture.detectChanges();

    const translocoService = TestBed.inject(TranslocoService);

    expect(element.textContent).toBe('W31c0m3 70 7r4n5l0c0 M4rkup');

    translocoService.setActiveLang('nl');
    fixture.detectChanges();

    expect(element.textContent).toBe('W31c0m3 70 7r4n5l0c0 M4rkup');
  });

  it('uses the provided translation parameters to render the translation text with markup', () => {
    component.translationKey = 'CALL_TO_ACTION';
    component.translationParameters = {
      presents: 'https://tooth-fairy.webshops.com/',
      name: 'the Tooth Fairy',
    };
    fixture.detectChanges();

    expect(element.textContent).toBe('Click here for some awesome presents provided by the Tooth Fairy');
    expect(element.querySelector('a')).toBeDefined();
    expect(element.querySelector('a')!.textContent).toBe('here');
    expect(element.querySelector('a')!.href).toBe('https://tooth-fairy.webshops.com/');
    expect(element.querySelector('a')!.target).toBe('_blank');
    expect(element.querySelector('i')).toBeDefined();
    expect(element.querySelector('i')!.textContent).toBe('the Tooth Fairy');

    component.translationParameters = {
      presents: { url: 'https://easter-eggies.com/', target: '_self' },
      name: 'de Paashaas',
    };
    fixture.detectChanges();

    expect(element.textContent).toBe('Click here for some awesome presents provided by de Paashaas');
    expect(element.querySelector('a')).toBeDefined();
    expect(element.querySelector('a')!.textContent).toBe('here');
    expect(element.querySelector('a')!.href).toBe('https://easter-eggies.com/');
    expect(element.querySelector('a')!.target).toBe('_self');
    expect(element.querySelector('i')).toBeDefined();
    expect(element.querySelector('i')!.textContent).toBe('de Paashaas');

    component.inlineLanguage = 'nl';
    fixture.detectChanges();

    expect(element.textContent).toBe('Klik hier voor geweldige cadeautjes geleverd door de Paashaas');
    expect(element.querySelector('a')).toBeDefined();
    expect(element.querySelector('a')!.textContent).toBe('hier');
    expect(element.querySelector('a')!.href).toBe('https://easter-eggies.com/');
    expect(element.querySelector('a')!.target).toBe('_self');
    expect(element.querySelector('i')).toBeDefined();
    expect(element.querySelector('i')!.textContent).toBe('de Paashaas');
  });

  it('uses the `TranslocoMissingHandler` to resolve translation texts for translations not available in the active language', () => {
    component.translationKey = 'TITLE';
    fixture.detectChanges();

    const missingHandler = TestBed.inject<TranslocoMissingHandler>(TRANSLOCO_MISSING_HANDLER);
    const handleMissingTranslationSpy = vi.spyOn(missingHandler, 'handle');

    expect(handleMissingTranslationSpy).not.toHaveBeenCalled();

    component.translationKey = 'UNKNOWN';
    fixture.detectChanges();

    expect(handleMissingTranslationSpy).toHaveBeenCalled();
    expect(handleMissingTranslationSpy.mock.calls[0][0]).toBe('UNKNOWN');
    expect(handleMissingTranslationSpy.mock.calls[0][1].activeLang).toBe('en');
    expect(element.textContent).toBe('UNKNOWN');

    handleMissingTranslationSpy.mockClear();
    component.translationKey = 'EMPTY';
    fixture.detectChanges();

    expect(handleMissingTranslationSpy).toHaveBeenCalled();
    expect(handleMissingTranslationSpy.mock.calls[0][0]).toBe('EMPTY');
    expect(handleMissingTranslationSpy.mock.calls[0][1].activeLang).toBe('en');
    expect(element.textContent).toBe('EMPTY');
  });

  it('renders an empty texts for empty translation texts and the `allowEmptyValues` option is enabled in the Transloco config', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        TranslocoMarkupComponent,
        TranslocoTestingModule.forRoot({
          translocoConfig: createTestTranslocoConfig({
            missingHandler: { allowEmpty: true },
          }),
          langs: TRANSLATIONS,
        }),
      ],
      providers: [defaultTranslocoMarkupTranspilers(), { provide: TRANSLOCO_SCOPE, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslocoMarkupComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    component.translationKey = 'TITLE';
    fixture.detectChanges();

    const missingHandler = TestBed.inject<TranslocoMissingHandler>(TRANSLOCO_MISSING_HANDLER);
    const handleMissingTranslationSpy = vi.spyOn(missingHandler, 'handle');

    expect(handleMissingTranslationSpy).not.toHaveBeenCalled();

    component.translationKey = 'EMPTY';
    fixture.detectChanges();

    expect(handleMissingTranslationSpy).not.toHaveBeenCalled();
    expect(element.textContent).toBe('');
  });

  it('uses the configured fallback language for translations not available in the active language', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        TranslocoMarkupComponent,
        TranslocoTestingModule.forRoot({
          translocoConfig: createTestTranslocoConfig({
            missingHandler: {
              logMissingKey: false,
              useFallbackTranslation: true,
            },
            fallbackLang: ['l33t', 'nl'],
          }),
          langs: TRANSLATIONS,
        }),
      ],
      providers: [defaultTranslocoMarkupTranspilers(), { provide: TRANSLOCO_SCOPE, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslocoMarkupComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    component.translationKey = 'SECRET';
    fixture.detectChanges();

    expect(element.textContent).toBe('b335 m4k3 h0n3y');
  });

  it('supports inline transpilers', () => {
    const convertBoldTagsToMarkdown = new StringReplaceTranspiler(
      new Map([
        ['[b]', '**'],
        ['[/b]', '**'],
      ]),
    );

    component.translationKey = 'TITLE';
    component.inlineTranspilers = convertBoldTagsToMarkdown;
    fixture.detectChanges();

    expect(element.textContent).toBe('Welcome to **Transloco Markup**');
    expect(element.querySelector('b')).toBeNull();
    expect(element.querySelector('i')).toBeDefined();
  });

  it('can exclude the provided transpilers when inline transpilers are specified and `mergeTranspilers` is set to `false`', () => {
    const convertBoldTagsToMarkdown = new StringReplaceTranspiler(
      new Map([
        ['[b]', '**'],
        ['[/b]', '**'],
      ]),
    );

    component.translationKey = 'TITLE';
    component.inlineTranspilers = convertBoldTagsToMarkdown;
    component.mergeTranspilers = false;
    fixture.detectChanges();

    expect(element.textContent).toBe('Welcome to **Transloco [i]Markup[/i]**');
    expect(element.querySelector('b')).toBeNull();
    expect(element.querySelector('i')).toBeNull();
  });

  it('supports provided scopes', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        TranslocoMarkupComponent,
        TranslocoTestingModule.forRoot({
          translocoConfig: createTestTranslocoConfig(),
          langs: TRANSLATIONS,
        }),
      ],
      providers: [
        defaultTranslocoMarkupTranspilers(),
        {
          provide: TRANSLOCO_SCOPE,
          useValue: [
            {
              scope: 'alt',
              loader: {
                'alt/en': () =>
                  Promise.resolve({
                    TITLE: 'You are welcomed to [i]Transloco [b]Markup[/b][/i]',
                  }),
                'alt/nl': () =>
                  Promise.resolve({
                    SECRET: '[b]P[/b]sssst!',
                  }),
              },
            },
          ],
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslocoMarkupComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    component.translationKey = 'alt.TITLE';
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();
    await tickAsync(50);

    expect(element.textContent).toBe('You are welcomed to Transloco Markup');
    expect(element.querySelector('i')).toBeDefined();
    expect(element.querySelector('i')!.textContent).toBe('Transloco Markup');
    expect(element.querySelector('b')).toBeDefined();
    expect(element.querySelector('b')!.textContent).toBe('Markup');

    component.inlineLanguage = 'nl';
    component.translationKey = 'alt.SECRET';
    fixture.detectChanges();

    await fixture.whenStable();
    fixture.detectChanges();
    await tickAsync(50);

    expect(element.textContent).toBe('Psssst!');
    expect(element.querySelector('i')).toBeNull();
    expect(element.querySelector('b')).toBeDefined();
    expect(element.querySelector('b')!.textContent).toBe('P');
  });

  it('supports inlines scopes', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [
        TranslocoMarkupComponent,
        TranslocoTestingModule.forRoot({
          translocoConfig: createTestTranslocoConfig(),
          langs: TRANSLATIONS,
        }),
      ],
      providers: [defaultTranslocoMarkupTranspilers(), { provide: TRANSLOCO_SCOPE, useValue: null }],
    }).compileComponents();

    fixture = TestBed.createComponent(TranslocoMarkupComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    component.translationKey = 'alt.SECRET';
    component.inlineScope = 'alt';

    const testingLoader: TestingLoader = TestBed.inject<TestingLoader>(TRANSLOCO_LOADER);

    vi.spyOn(testingLoader, 'getTranslation').mockImplementation((path: string) => {
      if (path === 'en') {
        return of(TRANSLATIONS.en);
      }

      if (path === 'alt/en') {
        return of({
          SECRET: 'You can find [b]treasure[/b] hidden inside this code!',
        });
      }

      if (path === 'clue/en') {
        return of({
          SECRET: 'Dig [i]deeper[/i]!',
        });
      }

      throw new Error(`No mock loader has been defined for "${path}"`);
    });

    fixture.detectChanges();

    expect(element.textContent).toBe('You can find treasure hidden inside this code!');
    expect(element.querySelector('b')).toBeDefined();
    expect(element.querySelector('b')!.textContent).toBe('treasure');

    component.inlineScope = 'clue';
    component.translationKey = 'clue.SECRET';
    fixture.detectChanges();

    expect(element.textContent).toBe('Dig deeper!');
    expect(element.querySelector('i')).toBeDefined();
    expect(element.querySelector('i')!.textContent).toBe('deeper');
  });
});

class StringReplaceTranspiler implements TranslationMarkupTranspiler {
  private readonly Replacement = class Replacement {
    constructor(public readonly value: string) {}
  };

  constructor(private readonly replacements: Map<string, string>) {}

  public tokenize(translation: string, offset: number): TokenizeResult | undefined {
    for (const [key, value] of this.replacements) {
      if (translation.startsWith(key, offset)) {
        return {
          token: new this.Replacement(value),
          nextOffset: offset + key.length,
        };
      }
    }

    return undefined;
  }

  public transpile(offset: number, { tokens }: TranslationMarkupTranspilerContext): TranspileResult | undefined {
    const token = tokens[offset];

    if (!(token instanceof this.Replacement)) {
      return undefined;
    }

    return {
      nextOffset: offset + 1,
      renderer: () => document.createTextNode(token.value),
    };
  }
}
