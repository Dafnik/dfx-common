import { ResourceRef, ResourceStatus, Signal, computed, isSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RedirectCommand,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
  provideRouter,
} from '@angular/router';

import { Input, OPAClient, Result } from '@open-policy-agent/opa';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Authz } from './authz';
import { AuthzOptions, provideAuthz } from './config';
import { authzCanActivate, authzCanActivateChild, authzCanMatch } from './guard';

interface FakeResource<T> {
  resourceRef: ResourceRef<T | undefined>;
  setError: (error: Error) => void;
  setIdle: () => void;
  setLoading: () => void;
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
      error.set(undefined);
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
      error.set(undefined);
      value.update(updater);
    },
    value,
  } as unknown as ResourceRef<T | undefined>;

  return {
    resourceRef,
    setError: (nextError: Error) => {
      error.set(nextError);
      hasValueState.set(false);
      value.set(undefined);
      status.set('error');
    },
    setIdle: () => {
      error.set(undefined);
      hasValueState.set(false);
      value.set(undefined);
      status.set('idle');
    },
    setLoading: () => {
      error.set(undefined);
      hasValueState.set(false);
      value.set(undefined);
      status.set('loading');
    },
    setResolved: (nextValue: T) => {
      error.set(undefined);
      hasValueState.set(true);
      value.set(nextValue);
      status.set('resolved');
    },
  };
}

describe('authz guards', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  const createRouteSnapshot = ({
    data,
    params,
  }: {
    data?: unknown;
    params?: Record<string, string>;
  } = {}): ActivatedRouteSnapshot =>
    ({
      data: (data ?? {}) as ActivatedRouteSnapshot['data'],
      params: params ?? {},
      routeConfig: {
        data: (data ?? {}) as Route['data'],
      },
    }) as ActivatedRouteSnapshot;

  const createRouterState = (url: string): RouterStateSnapshot => ({ url }) as RouterStateSnapshot;

  const runInContext = <T>(callback: () => T): T => TestBed.runInInjectionContext(callback);

  const setupWithAuthzMock = <T>() => {
    const fakeResource = createFakeResource<T>();
    const authz = {
      evaluate: vi.fn().mockReturnValue(fakeResource.resourceRef),
    } satisfies Pick<Authz, 'evaluate'>;

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: Authz, useValue: authz }],
    });

    return {
      authz,
      fakeResource,
      router: TestBed.inject(Router),
    };
  };

  const setupWithRealAuthz = ({
    authzOptions = {},
    opaClient,
  }: {
    authzOptions?: Omit<AuthzOptions, 'opaClient'>;
    opaClient: OPAClient | Signal<OPAClient>;
  }) => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        Authz,
        provideAuthz({
          opaClient,
          ...authzOptions,
        }),
      ],
    });

    return {
      router: TestBed.inject(Router),
    };
  };

  it('should forward explicit canActivate inputs to Authz.evaluate', async () => {
    const { authz, fakeResource } = setupWithAuthzMock<boolean>();
    fakeResource.setResolved(true);

    const guard = authzCanActivate({
      input: { user: 'alice' },
      path: 'tickets/allow',
    });

    const guardPromise = runInContext(() => guard(createRouteSnapshot(), createRouterState('/tickets')));
    const [pathArg, inputArg, fromResultArg] = authz.evaluate.mock.calls[0] as [
      string | Signal<string | undefined> | undefined,
      Input | Signal<Input | undefined> | undefined,
      ((_?: Result) => unknown) | undefined,
    ];

    expect(isSignal(pathArg)).toBe(true);
    expect(isSignal(inputArg)).toBe(true);
    expect(pathArg && isSignal(pathArg) ? pathArg() : pathArg).toBe('tickets/allow');
    expect(inputArg && isSignal(inputArg) ? inputArg() : inputArg).toEqual({ user: 'alice' });
    expect(fromResultArg).toBeUndefined();
    await expect(guardPromise).resolves.toBe(true);
  });

  it('should prefer explicit options over route-data and bind canActivate fromResult to context', async () => {
    const { authz, fakeResource, router } = setupWithAuthzMock<boolean>();
    fakeResource.setResolved(true);

    const guard = authzCanActivate({
      fromResult: (_result, context) => (context.state.url === '/tickets/manage' ? context.router.parseUrl('/forbidden') : true),
      path: 'tickets/manage',
    });

    const guardPromise = runInContext(() =>
      guard(
        createRouteSnapshot({
          data: {
            authz: {
              input: { user: 'alice' },
              path: 'tickets/read',
            },
          },
        }),
        createRouterState('/tickets/manage'),
      ),
    );
    const [pathArg, inputArg, fromResultArg] = authz.evaluate.mock.calls[0] as [
      string | Signal<string | undefined> | undefined,
      Input | Signal<Input | undefined> | undefined,
      ((_?: Result) => unknown) | undefined,
    ];

    expect(pathArg && isSignal(pathArg) ? pathArg() : pathArg).toBe('tickets/manage');
    expect(inputArg && isSignal(inputArg) ? inputArg() : inputArg).toEqual({ user: 'alice' });
    expect(router.serializeUrl(fromResultArg?.({ allowed: false }) as UrlTree)).toBe('/forbidden');
    await expect(guardPromise).resolves.toBe(true);
  });

  it('should forward route-data canMatch inputs to Authz.evaluate', async () => {
    const { authz, fakeResource } = setupWithAuthzMock<boolean>();
    fakeResource.setResolved(true);

    const guard = authzCanMatch();
    const guardPromise = runInContext(() =>
      guard(
        {
          data: {
            authz: {
              input: { section: 'reports' },
              path: 'reports/allow',
            },
          },
          path: 'reports',
        },
        [new UrlSegment('reports', {})],
        undefined,
      ),
    );
    const [pathArg, inputArg] = authz.evaluate.mock.calls[0] as [
      string | Signal<string | undefined> | undefined,
      Input | Signal<Input | undefined> | undefined,
    ];

    expect(pathArg && isSignal(pathArg) ? pathArg() : pathArg).toBe('reports/allow');
    expect(inputArg && isSignal(inputArg) ? inputArg() : inputArg).toEqual({ section: 'reports' });
    await expect(guardPromise).resolves.toBe(true);
  });

  it('should support canActivateChild', async () => {
    const { authz, fakeResource } = setupWithAuthzMock<boolean>();
    fakeResource.setResolved(true);

    const guard = authzCanActivateChild({
      path: 'children/allow',
    });

    const result = await runInContext(() => guard(createRouteSnapshot(), createRouterState('/children')));
    const [pathArg] = authz.evaluate.mock.calls[0] as [string | Signal<string | undefined> | undefined];

    expect(pathArg && isSignal(pathArg) ? pathArg() : pathArg).toBe('children/allow');
    expect(result).toBe(true);
  });

  it('should wait for loading resources to settle', async () => {
    const { fakeResource } = setupWithAuthzMock<boolean>();
    fakeResource.setLoading();

    const guard = authzCanActivate({
      path: 'tickets/allow',
    });

    let settled = false;
    const guardPromise = Promise.resolve(runInContext(() => guard(createRouteSnapshot(), createRouterState('/tickets')))).then((result) => {
      settled = true;
      return result;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    fakeResource.setResolved(true);

    await expect(guardPromise).resolves.toBe(true);
    expect(settled).toBe(true);
  });

  it('should return false for idle resources', async () => {
    const { fakeResource } = setupWithAuthzMock<boolean>();
    fakeResource.setIdle();

    const guard = authzCanActivate({
      path: 'tickets/allow',
    });

    await expect(runInContext(() => guard(createRouteSnapshot(), createRouterState('/tickets')))).resolves.toBe(false);
  });

  it('should return false for raw non-guard values', async () => {
    const { fakeResource } = setupWithAuthzMock<Result>();
    fakeResource.setResolved({ allowed: true });

    const guard = authzCanActivate({
      path: 'tickets/allow',
    });

    await expect(runInContext(() => guard(createRouteSnapshot(), createRouterState('/tickets')))).resolves.toBe(false);
  });

  it('should return false by default when the authz resource errors', async () => {
    const { fakeResource } = setupWithAuthzMock<boolean>();
    fakeResource.setError(new Error('boom'));

    const guard = authzCanActivate({
      path: 'tickets/allow',
    });

    await expect(runInContext(() => guard(createRouteSnapshot(), createRouterState('/tickets')))).resolves.toBe(false);
  });

  it('should allow onError to redirect after authz failures', async () => {
    const { fakeResource, router } = setupWithAuthzMock<boolean>();
    fakeResource.setError(new Error('boom'));

    const guard = authzCanActivate({
      onError: (_error, context) => new RedirectCommand(context.router.parseUrl('/sign-in')),
      path: 'tickets/allow',
    });

    const result = await runInContext(() => guard(createRouteSnapshot(), createRouterState('/tickets')));

    expect(result).toBeInstanceOf(RedirectCommand);
    expect(router.serializeUrl((result as RedirectCommand).redirectTo)).toBe('/sign-in');
  });

  it('should fall back to Authz defaults when guard options omit fields', async () => {
    const evaluate = vi
      .fn()
      .mockImplementation((_path: string, _input?: unknown, opts?: { fromResult?: (_?: Result) => unknown }) =>
        Promise.resolve(opts?.fromResult ? opts.fromResult({ allowed: true }) : { allowed: true }),
      );
    setupWithRealAuthz({
      authzOptions: {
        defaultFromResult: (result?: Result) => Boolean((result as { allowed?: boolean } | undefined)?.allowed),
        defaultInput: signal({ tenant: 'acme' }),
        defaultPath: signal('tickets/allow'),
      },
      opaClient: {
        evaluate,
      } as unknown as OPAClient,
    });

    const guard = authzCanActivate();
    const result = await runInContext(() => guard(createRouteSnapshot(), createRouterState('/tickets')));

    expect(result).toBe(true);
    expect(evaluate).toHaveBeenCalledWith('tickets/allow', { tenant: 'acme' }, { fromResult: expect.any(Function) });
  });

  it('should return redirect results produced by a guard fromResult through Authz.evaluate', async () => {
    const evaluate = vi
      .fn()
      .mockImplementation((_path: string, _input?: unknown, opts?: { fromResult?: (_?: Result) => unknown }) =>
        Promise.resolve(opts?.fromResult ? opts.fromResult({ allowed: false }) : { allowed: false }),
      );
    const { router } = setupWithRealAuthz({
      opaClient: {
        evaluate,
      } as unknown as OPAClient,
    });

    const guard = authzCanActivate({
      fromResult: (result, context) =>
        (result as { allowed?: boolean } | undefined)?.allowed ? true : context.router.parseUrl('/forbidden'),
      path: 'tickets/allow',
    });

    const result = await runInContext(() => guard(createRouteSnapshot(), createRouterState('/tickets')));

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe('/forbidden');
  });

  it('should preserve Authz cache behavior across repeated guard evaluations', async () => {
    const evaluate = vi.fn().mockResolvedValue(true);
    setupWithRealAuthz({
      authzOptions: {
        cache: {},
      },
      opaClient: {
        evaluate,
      } as unknown as OPAClient,
    });

    const guard = authzCanActivate({
      input: { user: 'alice' },
      path: 'tickets/allow',
    });

    await runInContext(() => guard(createRouteSnapshot(), createRouterState('/tickets')));
    await runInContext(() => guard(createRouteSnapshot(), createRouterState('/tickets')));

    expect(evaluate).toHaveBeenCalledTimes(1);
  });
});
