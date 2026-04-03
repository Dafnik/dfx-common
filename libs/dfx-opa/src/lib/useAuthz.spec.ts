import { Injector, ResourceRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Input, Result } from '@open-policy-agent/opa';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Authz } from './authz';
import { useAuthz } from './useAuthz';

describe('useAuthz', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  const setup = <T>({
    options = {},
  }: {
    options?: Parameters<typeof useAuthz<T>>[0];
  } = {}) => {
    const resourceRef = {
      destroy: vi.fn(),
      error: vi.fn(() => undefined),
      hasValue: vi.fn(() => false),
      isLoading: vi.fn(() => false),
      reload: vi.fn(() => false),
      set: vi.fn(),
      status: vi.fn(() => 'idle'),
      update: vi.fn(),
      value: vi.fn(() => undefined),
      asReadonly: vi.fn(),
      snapshot: vi.fn(),
    } as unknown as ResourceRef<T | undefined>;

    const authz = {
      evaluate: vi.fn().mockReturnValue(resourceRef),
    } satisfies Pick<Authz, 'evaluate'>;

    TestBed.configureTestingModule({
      providers: [{ provide: Authz, useValue: authz }],
    });

    const injector = TestBed.inject(Injector);
    const result = useAuthz<T>({
      injector,
      ...options,
    });

    return { authz, injector, resourceRef, result };
  };

  it('should return the resource from Authz.evaluate', () => {
    const { authz, resourceRef, result } = setup<boolean>();

    expect(result).toBe(resourceRef);
    expect(authz.evaluate).toHaveBeenCalledWith(undefined, undefined, undefined);
  });

  it('should forward path, input, and fromResult to Authz.evaluate', () => {
    const fromResult = vi.fn((value?: Result) => Boolean((value as { allowed?: boolean } | undefined)?.allowed));
    const { authz } = setup<boolean>({
      options: {
        input: { user: 'alice' },
        path: 'tickets/allow',
        fromResult,
      },
    });

    expect(authz.evaluate).toHaveBeenCalledWith('tickets/allow', { user: 'alice' }, fromResult);
  });

  it('should work with an explicit injector', () => {
    const { authz, injector } = setup<boolean>();

    useAuthz<boolean>({ injector });

    expect(authz.evaluate).toHaveBeenCalledTimes(2);
  });
});
