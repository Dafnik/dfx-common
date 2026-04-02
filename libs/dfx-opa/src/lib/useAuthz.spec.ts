import { Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Observable, Subject, of, throwError } from 'rxjs';

import { Input, OPAClient, Result } from '@open-policy-agent/opa';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Authz } from './authz';
import { AuthzOptions, provideAuthz } from './config';
import { useAuthz } from './useAuthz';

describe('useAuthz', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  const createOPAClient = (): OPAClient =>
    ({
      evaluate: vi.fn(),
    }) as unknown as OPAClient;

  const setup = <T>({
    authzOptions,
    evaluateReturnValue = of(true as T),
    options = {},
  }: {
    authzOptions?: Omit<AuthzOptions, 'opaClient'>;
    evaluateReturnValue?: Observable<T>;
    options?: Parameters<typeof useAuthz<T>>[0];
  } = {}) => {
    const authz = {
      evaluate: vi.fn().mockReturnValue(evaluateReturnValue),
    } satisfies Pick<Authz, 'evaluate'>;

    TestBed.configureTestingModule({
      providers: [
        provideAuthz({
          opaClient: createOPAClient(),
          ...authzOptions,
        }),
        { provide: Authz, useValue: authz },
      ],
    });

    const injector = TestBed.inject(Injector);
    const result = useAuthz<T>({
      injector,
      ...options,
    });

    return { authz, injector, result };
  };

  it('should return an immediate error when neither path nor defaultPath is provided', () => {
    const { authz, result } = setup<boolean>({
      options: {},
    });

    expect(result()).toEqual({
      error: new Error('[authzDirective] No defaultPath or path was given. "undefined"'),
      isLoading: false,
      result: undefined,
    });
    expect(authz.evaluate).not.toHaveBeenCalled();
  });

  it('should start in loading state and then resolve successfully', async () => {
    const response$ = new Subject<boolean>();
    const { authz, result } = setup<boolean>({
      evaluateReturnValue: response$.asObservable(),
      options: {
        input: { user: 'alice' },
        path: 'tickets/allow',
      },
    });

    expect(result()).toEqual({
      error: undefined,
      isLoading: true,
      result: undefined,
    });
    expect(authz.evaluate).toHaveBeenCalledWith('tickets/allow', { user: 'alice' }, { fromResult: undefined });

    response$.next(true);
    response$.complete();

    await vi.waitFor(() =>
      expect(result()).toEqual({
        error: undefined,
        isLoading: false,
        result: true,
      }),
    );
  });

  it('should surface evaluate errors', async () => {
    const error = new Error('denied');
    const { result } = setup<boolean>({
      evaluateReturnValue: throwError(() => error),
      options: {
        path: 'tickets/allow',
      },
    });

    await vi.waitFor(() =>
      expect(result()).toEqual({
        error,
        isLoading: false,
        result: undefined,
      }),
    );
  });

  it('should use defaultPath from the provider when no path is passed', async () => {
    const { authz, result } = setup<boolean>({
      authzOptions: {
        defaultPath: 'tickets/allow',
      },
      options: {},
    });

    await vi.waitFor(() =>
      expect(result()).toEqual({
        error: undefined,
        isLoading: false,
        result: true,
      }),
    );
    expect(authz.evaluate).toHaveBeenCalledWith('tickets/allow', undefined, { fromResult: undefined });
  });

  it('should merge object input with defaultInput from the provider', async () => {
    const { authz } = setup<boolean>({
      authzOptions: {
        defaultInput: { tenant: 'acme', user: 'alice' },
        defaultPath: 'tickets/allow',
      },
      options: {
        input: { action: 'read' },
      },
    });

    await vi.waitFor(() => expect(authz.evaluate).toHaveBeenCalledTimes(1));
    expect(authz.evaluate).toHaveBeenCalledWith(
      'tickets/allow',
      { action: 'read', tenant: 'acme', user: 'alice' },
      { fromResult: undefined },
    );
  });

  it('should let a per-call fromResult override the provider default', async () => {
    const providerFromResult = vi.fn((value?: Result) => Boolean((value as { allowed?: boolean } | undefined)?.allowed));
    const callFromResult = vi.fn(() => true);
    const { authz } = setup<boolean>({
      authzOptions: {
        defaultFromResult: providerFromResult,
        defaultPath: 'tickets/allow',
      },
      options: {
        fromResult: callFromResult,
      },
    });

    await vi.waitFor(() => expect(authz.evaluate).toHaveBeenCalledTimes(1));
    expect(authz.evaluate).toHaveBeenCalledWith('tickets/allow', undefined, { fromResult: callFromResult });
  });

  it('should reevaluate when the path signal changes', async () => {
    const path = signal('tickets/allow');
    const { authz } = setup<boolean>({
      options: {
        path,
      },
    });

    await vi.waitFor(() => expect(authz.evaluate).toHaveBeenCalledTimes(1));
    path.set('tickets/manage');
    TestBed.tick();

    await vi.waitFor(() => expect(authz.evaluate).toHaveBeenCalledTimes(2));
    expect(authz.evaluate).toHaveBeenNthCalledWith(1, 'tickets/allow', undefined, { fromResult: undefined });
    expect(authz.evaluate).toHaveBeenNthCalledWith(2, 'tickets/manage', undefined, { fromResult: undefined });
  });

  it('should reevaluate when the input signal changes', async () => {
    const input = signal<Input>({ action: 'read' });
    const { authz } = setup<boolean>({
      authzOptions: {
        defaultPath: 'tickets/allow',
      },
      options: {
        input,
      },
    });

    await vi.waitFor(() => expect(authz.evaluate).toHaveBeenCalledTimes(1));
    input.set({ action: 'write' });
    TestBed.tick();

    await vi.waitFor(() => expect(authz.evaluate).toHaveBeenCalledTimes(2));
    expect(authz.evaluate).toHaveBeenNthCalledWith(1, 'tickets/allow', { action: 'read' }, { fromResult: undefined });
    expect(authz.evaluate).toHaveBeenNthCalledWith(2, 'tickets/allow', { action: 'write' }, { fromResult: undefined });
  });

  it('should reevaluate when defaultPath from the provider is a signal', async () => {
    const defaultPath = signal('tickets/allow');
    const { authz } = setup<boolean>({
      authzOptions: {
        defaultPath,
      },
      options: {},
    });

    await vi.waitFor(() => expect(authz.evaluate).toHaveBeenCalledTimes(1));
    defaultPath.set('tickets/audit');
    TestBed.tick();

    await vi.waitFor(() => expect(authz.evaluate).toHaveBeenCalledTimes(2));
    expect(authz.evaluate).toHaveBeenNthCalledWith(1, 'tickets/allow', undefined, { fromResult: undefined });
    expect(authz.evaluate).toHaveBeenNthCalledWith(2, 'tickets/audit', undefined, { fromResult: undefined });
  });

  it('should reevaluate when defaultInput from the provider is a signal', async () => {
    const defaultInput = signal<Input>({ tenant: 'acme' });
    const { authz } = setup<boolean>({
      authzOptions: {
        defaultInput,
        defaultPath: 'tickets/allow',
      },
      options: {
        input: { action: 'read' },
      },
    });

    await vi.waitFor(() => expect(authz.evaluate).toHaveBeenCalledTimes(1));
    defaultInput.set({ tenant: 'globex' });
    TestBed.tick();

    await vi.waitFor(() => expect(authz.evaluate).toHaveBeenCalledTimes(2));
    expect(authz.evaluate).toHaveBeenNthCalledWith(1, 'tickets/allow', { action: 'read', tenant: 'acme' }, { fromResult: undefined });
    expect(authz.evaluate).toHaveBeenNthCalledWith(2, 'tickets/allow', { action: 'read', tenant: 'globex' }, { fromResult: undefined });
  });
});
