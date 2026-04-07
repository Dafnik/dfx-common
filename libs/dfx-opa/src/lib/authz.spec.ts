import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Input, OPAClient, RequestOptions, Result } from '@open-policy-agent/opa';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Authz } from './authz';
import { AuthzOptions, provideAuthz } from './config';

describe('Authz', () => {
  afterEach(() => {
    vi.useRealTimers();
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
    const evaluate = vi
      .fn()
      .mockImplementation((_path: string, _input?: unknown, opts?: RequestOptions<boolean>) =>
        Promise.resolve(opts?.fromResult ? opts.fromResult(result) : result),
      );
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
    expect(resourceRef.value()).toBe(true);
    expect(evaluate).toHaveBeenCalledWith('tickets/allow', { user: 'alice' }, opts);
  });

  it('should keep uncached requests independent when cache is omitted', async () => {
    const evaluate = vi.fn().mockResolvedValue({ allowed: true });
    const service = setup({
      opaClient: {
        evaluate,
      } as unknown as OPAClient,
    });

    const first = service.evaluate('tickets/allow', { user: 'alice' });
    const second = service.evaluate('tickets/allow', { user: 'alice' });

    await vi.waitFor(() => expect(first.status()).toBe('resolved'));
    await vi.waitFor(() => expect(second.status()).toBe('resolved'));
    expect(evaluate).toHaveBeenCalledTimes(2);
  });

  it('should dedupe identical requests when cache is enabled', async () => {
    const result = { allowed: true };
    const evaluate = vi.fn().mockResolvedValue(result);
    const service = setup({
      authzOptions: {
        cache: {},
      },
      opaClient: {
        evaluate,
      } as unknown as OPAClient,
    });

    const first = service.evaluate('tickets/allow', { user: 'alice' });
    const second = service.evaluate('tickets/allow', { user: 'alice' });

    await vi.waitFor(() => expect(first.status()).toBe('resolved'));
    await vi.waitFor(() => expect(second.status()).toBe('resolved'));
    expect(first.value()).toEqual(result);
    expect(second.value()).toEqual(result);
    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(evaluate).toHaveBeenCalledWith('tickets/allow', { user: 'alice' });
  });

  it('should dedupe equivalent object inputs with different key order', async () => {
    const evaluate = vi.fn().mockResolvedValue({ allowed: true });
    const service = setup({
      authzOptions: {
        cache: {},
      },
      opaClient: {
        evaluate,
      } as unknown as OPAClient,
    });

    const first = service.evaluate('tickets/allow', { user: 'alice', tenant: 'acme' });
    const second = service.evaluate('tickets/allow', { tenant: 'acme', user: 'alice' });

    await vi.waitFor(() => expect(first.status()).toBe('resolved'));
    await vi.waitFor(() => expect(second.status()).toBe('resolved'));
    expect(evaluate).toHaveBeenCalledTimes(1);
  });

  it('should serialize circular inputs without overflowing the stack', async () => {
    const evaluate = vi.fn().mockResolvedValue({ allowed: true });
    const service = setup({
      authzOptions: {
        cache: {},
      },
      opaClient: {
        evaluate,
      } as unknown as OPAClient,
    });
    const input = { tenant: 'acme' } as Record<string, unknown>;
    input['self'] = input;

    const first = service.evaluate('tickets/allow', input as unknown as Input);
    const second = service.evaluate('tickets/allow', input as unknown as Input);

    await vi.waitFor(() => expect(first.status()).toBe('resolved'));
    await vi.waitFor(() => expect(second.status()).toBe('resolved'));
    expect(evaluate).toHaveBeenCalledTimes(1);
  });

  it('should share cached backend responses across different fromResult functions', async () => {
    const evaluate = vi.fn().mockResolvedValue({ allowed: true, reason: 'policy' });
    const service = setup({
      authzOptions: {
        cache: {},
      },
      opaClient: {
        evaluate,
      } as unknown as OPAClient,
    });

    const allowed = service.evaluate('tickets/allow', { user: 'alice' }, (value?: Result) =>
      Boolean((value as { allowed?: boolean } | undefined)?.allowed),
    );
    const reason = service.evaluate(
      'tickets/allow',
      { user: 'alice' },
      (value?: Result) => (value as { reason?: string } | undefined)?.reason,
    );

    await vi.waitFor(() => expect(allowed.status()).toBe('resolved'));
    await vi.waitFor(() => expect(reason.status()).toBe('resolved'));
    expect(allowed.value()).toBe(true);
    expect(reason.value()).toBe('policy');
    expect(evaluate).toHaveBeenCalledTimes(1);
  });

  it('should expire cached entries after ttlMs', async () => {
    let now = 1_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);

    const evaluate = vi.fn().mockResolvedValue({ allowed: true });
    const service = setup({
      authzOptions: {
        cache: {
          ttlMs: 30_000,
        },
      },
      opaClient: {
        evaluate,
      } as unknown as OPAClient,
    });

    const first = service.evaluate('tickets/allow', { user: 'alice' });
    await vi.waitFor(() => expect(first.status()).toBe('resolved'));
    expect(evaluate).toHaveBeenCalledTimes(1);

    now += 30_001;

    const second = service.evaluate('tickets/allow', { user: 'alice' });
    await vi.waitFor(() => expect(second.status()).toBe('resolved'));
    expect(evaluate).toHaveBeenCalledTimes(2);
  });

  it('should evict the least recently used entry when maxEntries is exceeded', async () => {
    const evaluate = vi.fn().mockResolvedValue({ allowed: true });
    const service = setup({
      authzOptions: {
        cache: {
          maxEntries: 2,
          ttlMs: 30_000,
        },
      },
      opaClient: {
        evaluate,
      } as unknown as OPAClient,
    });

    const allow = service.evaluate('tickets/allow', { user: 'alice' });
    await vi.waitFor(() => expect(allow.status()).toBe('resolved'));

    const audit = service.evaluate('tickets/audit', { user: 'alice' });
    await vi.waitFor(() => expect(audit.status()).toBe('resolved'));

    const allowAgain = service.evaluate('tickets/allow', { user: 'alice' });
    await vi.waitFor(() => expect(allowAgain.status()).toBe('resolved'));

    const manage = service.evaluate('tickets/manage', { user: 'alice' });
    await vi.waitFor(() => expect(manage.status()).toBe('resolved'));

    const auditAgain = service.evaluate('tickets/audit', { user: 'alice' });
    await vi.waitFor(() => expect(auditAgain.status()).toBe('resolved'));

    expect(evaluate).toHaveBeenCalledTimes(4);
  });

  it('should refresh the cached entry when reload is called', async () => {
    const evaluate = vi.fn().mockResolvedValueOnce({ allowed: true }).mockResolvedValueOnce({ allowed: false });
    const service = setup({
      authzOptions: {
        cache: {},
      },
      opaClient: {
        evaluate,
      } as unknown as OPAClient,
    });

    const resourceRef = service.evaluate('tickets/allow', { user: 'alice' });

    await vi.waitFor(() => expect(resourceRef.status()).toBe('resolved'));
    expect(resourceRef.value()).toEqual({ allowed: true });
    expect(resourceRef.reload()).toBe(true);
    await vi.waitFor(() => expect(resourceRef.value()).toEqual({ allowed: false }));
    expect(evaluate).toHaveBeenCalledTimes(2);

    const second = service.evaluate('tickets/allow', { user: 'alice' });
    await vi.waitFor(() => expect(second.status()).toBe('resolved'));
    expect(second.value()).toEqual({ allowed: false });
    expect(evaluate).toHaveBeenCalledTimes(2);
  });

  it('should not retain rejected requests in the cache', async () => {
    const evaluate = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({ allowed: true });
    const service = setup({
      authzOptions: {
        cache: {},
      },
      opaClient: {
        evaluate,
      } as unknown as OPAClient,
    });

    const first = service.evaluate('tickets/allow', { user: 'alice' });
    await vi.waitFor(() => expect(first.status()).toBe('error'));

    const second = service.evaluate('tickets/allow', { user: 'alice' });
    await vi.waitFor(() => expect(second.status()).toBe('resolved'));
    expect(evaluate).toHaveBeenCalledTimes(2);
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
