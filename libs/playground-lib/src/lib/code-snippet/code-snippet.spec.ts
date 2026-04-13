import { ComponentFixture, TestBed } from '@angular/core/testing';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PlaygroundCodeSnippet } from './code-snippet';
import { PlaygroundCodeSnippetLanguage } from './code-snippet.model';

describe('PlaygroundCodeSnippet', () => {
  let fixture: ComponentFixture<PlaygroundCodeSnippet>;
  let writeText: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    await TestBed.configureTestingModule({
      imports: [PlaygroundCodeSnippet],
    }).compileComponents();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createSnippet(code = '<qrcode [data]="data" />', lang: PlaygroundCodeSnippetLanguage = 'angular-html') {
    fixture = TestBed.createComponent(PlaygroundCodeSnippet);
    fixture.componentRef.setInput('label', 'HTML');
    fixture.componentRef.setInput('code', code);
    fixture.componentRef.setInput('lang', lang);
    fixture.detectChanges();

    return fixture.nativeElement as HTMLElement;
  }

  it('renders the label and raw fallback code before highlighting completes', () => {
    const element = createSnippet();

    expect(element.textContent).toContain('HTML');
    expect(element.querySelector('pre')?.textContent).toContain('<qrcode [data]="data" />');
  });

  it('renders highlighted Shiki markup', async () => {
    const element = createSnippet('const value = 1;', 'typescript');

    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(element.querySelector('.shiki')).not.toBeNull();
    });
  });

  it('copies raw code and resets the copied state', () => {
    vi.useFakeTimers();

    const code = 'const value = 1;';
    const element = createSnippet(code, 'typescript');
    const button = element.querySelector<HTMLButtonElement>('button')!;

    button.click();
    fixture.detectChanges();

    expect(writeText).toHaveBeenCalledWith(code);
    expect(button.getAttribute('data-copied')).toBe('true');

    vi.advanceTimersByTime(2000);
    fixture.detectChanges();

    expect(button.getAttribute('data-copied')).toBe('false');
  });
});
