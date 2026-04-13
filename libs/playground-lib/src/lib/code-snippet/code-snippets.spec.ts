import { ComponentFixture, TestBed } from '@angular/core/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlaygroundCodeSnippetFile } from './code-snippet.model';
import { PlaygroundCodeSnippets } from './code-snippets';

describe('PlaygroundCodeSnippets', () => {
  let fixture: ComponentFixture<PlaygroundCodeSnippets>;
  let writeText: ReturnType<typeof vi.fn>;

  const files: PlaygroundCodeSnippetFile[] = [
    {
      id: 'component',
      label: 'Component',
      filename: 'example.component.ts',
      lang: 'typescript',
      code: 'const component = true;',
    },
    {
      id: 'translation',
      label: 'Translation',
      filename: 'en.json',
      lang: 'json',
      code: '{\n  "GREETING": "Hello"\n}',
    },
  ];

  beforeEach(async () => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await TestBed.configureTestingModule({
      imports: [PlaygroundCodeSnippets],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createSnippets(snippetFiles = files) {
    fixture = TestBed.createComponent(PlaygroundCodeSnippets);
    fixture.componentRef.setInput('files', snippetFiles);
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  function findButton(element: HTMLElement, text: string): HTMLButtonElement {
    const button = Array.from(element.querySelectorAll('button')).find((it) => it.textContent?.includes(text));

    if (!button) {
      throw new Error(`Could not find button containing "${text}"`);
    }

    return button;
  }

  it('renders the first file and raw fallback code before highlighting completes', () => {
    const element = createSnippets();

    expect(element.textContent).toContain('example.component.ts');
    expect(element.querySelector('pre')?.textContent).toContain('const component = true;');
  });

  it('switches between file tabs', () => {
    const element = createSnippets();

    findButton(element, 'Translation').click();
    fixture.detectChanges();

    expect(element.textContent).toContain('en.json');
    expect(element.textContent).toContain('"GREETING": "Hello"');
  });

  it('renders highlighted Shiki markup for JSON files', async () => {
    const element = createSnippets();

    findButton(element, 'Translation').click();

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element.querySelector('.shiki')).not.toBeNull();
      expect(element.textContent).toContain('"GREETING"');
    });
  });

  it('copies the active file code and resets the copied state', () => {
    vi.useFakeTimers();

    const element = createSnippets();
    findButton(element, 'Translation').click();
    fixture.detectChanges();

    const copyButton = element.querySelector<HTMLButtonElement>('button[aria-label="Copy en.json code"]')!;

    copyButton.click();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith('{\n  "GREETING": "Hello"\n}');
    expect(copyButton.getAttribute('data-copied')).toBe('true');

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    expect(copyButton.getAttribute('data-copied')).toBe('false');
  });
});
