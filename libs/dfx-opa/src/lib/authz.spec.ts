import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { OPAClient, RequestOptions, Result } from '@open-policy-agent/opa';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Authz } from './authz';
import { AuthzOptions, provideAuthz } from './config';

describe('Authz', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  const setup = ({
    authzOptions = {},
    opaClient,
  }: {
    authzOptions?: Omit<AuthzOptions, 'opaClient'>;
    opaClient: OPAClient | Signal<OPAClient>;
  }): Authz => {
    TestBed.configureTestingModule({
      providers: [
        Authz,
        provideAuthz({
          opaClient,
          ...authzOptions,
        }),
      ],
    });

    return TestBed.inject(Authz);
  };

  it('should delegate evaluate calls to the configured OPA client', async () => {
    const result = { allowed: true };
    const evaluate = vi.fn().mockResolvedValue(result);
    const opaClient = {
      evaluate,
    } as unknown as OPAClient;
    const service = setup({ opaClient });
    const fromResult = vi.fn((value?: Result) => Boolean((value as { allowed?: boolean } | undefined)?.allowed));
    const opts: RequestOptions<boolean> = { fromResult };
    const resourceRef = service.evaluate('tickets/allow', { user: 'alice' }, opts.fromResult);

    expect(resourceRef.status()).toBe('loading');
    expect(resourceRef.isLoading()).toBe(true);
    expect(resourceRef.hasValue()).toBe(false);

    await vi.waitFor(() => expect(resourceRef.status()).toBe('resolved'));
    expect(resourceRef.hasValue()).toBe(true);
    expect(resourceRef.value()).toEqual(result);
    expect(evaluate).toHaveBeenCalledWith('tickets/allow', { user: 'alice' }, opts);
  });

  it('should stay idle when neither path nor defaultPath is available', () => {
    const evaluate = vi.fn();
    const service = setup({
      opaClient: {
        evaluate,
      } as unknown as OPAClient,
    });

    const resourceRef = service.evaluate('' as string | undefined);

    expect(resourceRef.status()).toBe('idle');
    expect(resourceRef.isLoading()).toBe(false);
    expect(resourceRef.hasValue()).toBe(false);
    expect(resourceRef.value()).toBeUndefined();
    expect(evaluate).not.toHaveBeenCalled();
  });

  it('should read the current OPA client when the provider uses a signal', async () => {
    const firstEvaluate = vi.fn().mockResolvedValue(false);
    const firstClient = {
      evaluate: firstEvaluate,
    } as unknown as OPAClient;
    const secondEvaluate = vi.fn().mockResolvedValue(true);
    const secondClient = {
      evaluate: secondEvaluate,
    } as unknown as OPAClient;
    const opaClient = signal(firstClient);
    const service = setup({ opaClient });

    opaClient.set(secondClient);
    const resourceRef = service.evaluate('tickets/allow');

    await vi.waitFor(() => expect(resourceRef.status()).toBe('resolved'));
    expect(resourceRef.hasValue()).toBe(true);
    expect(resourceRef.value()).toBe(true);
    expect(firstEvaluate).not.toHaveBeenCalled();
    expect(secondEvaluate).toHaveBeenCalledWith('tickets/allow', undefined, { fromResult: undefined });
  });

  it('should reevaluate when defaultPath from the provider is a signal', async () => {
    const evaluate = vi.fn().mockResolvedValue(true);
    const defaultPath = signal('tickets/allow');
    const service = setup({
      authzOptions: {
        defaultPath,
      },
      opaClient: {
        evaluate,
      } as unknown as OPAClient,
    });

    service.evaluate();

    await vi.waitFor(() => expect(evaluate).toHaveBeenCalledTimes(1));
    defaultPath.set('tickets/audit');
    TestBed.tick();

    await vi.waitFor(() => expect(evaluate).toHaveBeenCalledTimes(2));
    expect(evaluate).toHaveBeenNthCalledWith(1, 'tickets/allow', undefined, { fromResult: undefined });
    expect(evaluate).toHaveBeenNthCalledWith(2, 'tickets/audit', undefined, { fromResult: undefined });
  });

  it('should reevaluate when defaultInput from the provider is a signal', async () => {
    const evaluate = vi.fn().mockResolvedValue(true);
    const defaultInput = signal({ tenant: 'acme' });
    const service = setup({
      authzOptions: {
        defaultInput,
        defaultPath: 'tickets/allow',
      },
      opaClient: {
        evaluate,
      } as unknown as OPAClient,
    });

    service.evaluate(undefined, { action: 'read' });

    await vi.waitFor(() => expect(evaluate).toHaveBeenCalledTimes(1));
    defaultInput.set({ tenant: 'globex' });
    TestBed.tick();

    await vi.waitFor(() => expect(evaluate).toHaveBeenCalledTimes(2));
    expect(evaluate).toHaveBeenNthCalledWith(1, 'tickets/allow', { action: 'read', tenant: 'acme' }, { fromResult: undefined });
    expect(evaluate).toHaveBeenNthCalledWith(2, 'tickets/allow', { action: 'read', tenant: 'globex' }, { fromResult: undefined });
  });
});
