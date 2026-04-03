import { Component, ResourceRef, ResourceStatus, Signal, computed, isSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Input, OPAClient, Result } from '@open-policy-agent/opa';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Authz } from './authz';
import { provideAuthz } from './config';
import { AuthzDirective } from './directive';

interface FakeResource<T> {
  resourceRef: ResourceRef<T | undefined>;
  setNoValue: () => void;
  setResolved: (value: T) => void;
}

function createFakeResource<T>(): FakeResource<T> {
  const value = signal<T | undefined>(undefined);
  const status = signal<ResourceStatus>('loading');
  const error = signal<Error | undefined>(undefined);
  const hasValueState = signal(false);

  const resourceRef = {
    asReadonly: vi.fn(),
    destroy: vi.fn(),
    error,
    hasValue: () => hasValueState(),
    isLoading: computed(() => status() === 'loading' || status() === 'reloading'),
    reload: vi.fn(() => false),
    set: (nextValue: T | undefined) => {
      value.set(nextValue);
      hasValueState.set(nextValue !== undefined);
      status.set('local');
    },
    snapshot: computed(() => {
      const currentStatus = status();

      if (currentStatus === 'error') {
        return { error: error()!, status: 'error' as const };
      }

      return {
        status: currentStatus,
        value: value(),
      };
    }),
    status,
    update: (updater: (current: T | undefined) => T | undefined) => {
      value.update(updater);
    },
    value,
  } as unknown as ResourceRef<T | undefined>;

  return {
    resourceRef,
    setNoValue: () => {
      error.set(undefined);
      hasValueState.set(false);
      value.set(undefined);
      status.set('resolved');
    },
    setResolved: (nextValue: T) => {
      error.set(undefined);
      hasValueState.set(true);
      value.set(nextValue);
      status.set('resolved');
    },
  };
}

@Component({
  imports: [AuthzDirective],
  selector: 'opa-test',
  template: `
    <ng-template
      [authz]="path()"
      [authzInput]="authzInput()"
      [authzFromResult]="fromResult"
      [authzElse]="elseTpl"
      [authzLoading]="loadingTpl">
      <span class="then-content">allowed</span>
    </ng-template>

    <ng-template #elseTpl>
      <span class="else-content">denied</span>
    </ng-template>

    <ng-template #loadingTpl>
      <span class="loading-content">loading</span>
    </ng-template>
  `,
})
class HostComponent {
  path = signal('tickets/allow');
  authzInput = signal<Input>({ action: 'read' });
  fromResult = vi.fn((value?: Result) => Boolean((value as { allowed?: boolean } | undefined)?.allowed));
}

describe('AuthzDirective', () => {
  let authz: Pick<Authz, 'evaluate'> & { evaluate: ReturnType<typeof vi.fn> };
  let fakeResource: FakeResource<boolean>;
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = (selector: string): HTMLElement | null => fixture.nativeElement.querySelector(selector);

  beforeEach(async () => {
    fakeResource = createFakeResource<boolean>();
    authz = {
      evaluate: vi.fn().mockReturnValue(fakeResource.resourceRef),
    };

    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideAuthz({
          opaClient: {
            evaluate: vi.fn(),
          } as unknown as OPAClient,
        }),
        { provide: Authz, useValue: authz },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('should render the loading template while authz is loading', () => {
    expect(query('.loading-content')?.textContent).toContain('loading');
    expect(query('.then-content')).toBeNull();
    expect(query('.else-content')).toBeNull();
  });

  it('should render the main template when authz resolves truthy', () => {
    fakeResource.setResolved(true);
    fixture.detectChanges();

    expect(query('.then-content')?.textContent).toContain('allowed');
    expect(query('.loading-content')).toBeNull();
    expect(query('.else-content')).toBeNull();
  });

  it('should render the else template when authz resolves falsy', () => {
    fakeResource.setResolved(false);
    fixture.detectChanges();

    expect(query('.else-content')?.textContent).toContain('denied');
    expect(query('.loading-content')).toBeNull();
    expect(query('.then-content')).toBeNull();
  });

  it('should clear previous truthy content when the resource no longer has a value', () => {
    fakeResource.setResolved(true);
    fixture.detectChanges();
    expect(query('.then-content')).not.toBeNull();

    fakeResource.setNoValue();
    fixture.detectChanges();

    expect(query('.else-content')?.textContent).toContain('denied');
    expect(query('.then-content')).toBeNull();
  });

  it('should pass path/input signals and the initialization-time fromResult into Authz.evaluate', () => {
    expect(authz.evaluate).toHaveBeenCalledTimes(1);

    const [pathArg, inputArg, fromResultArg] = authz.evaluate.mock.calls[0] as [
      string | Signal<string | undefined>,
      Input | Signal<Input> | undefined,
      ((_?: Result) => boolean) | undefined,
    ];

    expect(isSignal(pathArg)).toBe(true);
    expect(isSignal(inputArg)).toBe(true);
    expect(isSignal(pathArg) ? pathArg() : pathArg).toBe('tickets/allow');
    expect(inputArg && isSignal(inputArg) ? inputArg() : inputArg).toEqual({ action: 'read' });
    expect(fromResultArg).toBeUndefined();
  });

  it('should react to host signal input changes through the existing resource wiring', () => {
    const [pathArg, inputArg] = authz.evaluate.mock.calls[0] as [Signal<string | undefined>, Signal<Input>];

    host.path.set('tickets/manage');
    host.authzInput.set({ action: 'write' });
    fixture.detectChanges();

    expect(authz.evaluate).toHaveBeenCalledTimes(1);
    expect(pathArg()).toBe('tickets/manage');
    expect(inputArg()).toEqual({ action: 'write' });
  });
});
