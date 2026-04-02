import { Signal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { firstValueFrom } from 'rxjs';

import { OPAClient, RequestOptions, Result } from '@open-policy-agent/opa';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Authz } from './authz';
import { provideAuthz } from './config';

describe('Authz', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  const setup = (opaClient: OPAClient | Signal<OPAClient>): Authz => {
    TestBed.configureTestingModule({
      providers: [Authz, provideAuthz({ opaClient })],
    });

    return TestBed.inject(Authz);
  };

  it('should delegate evaluate calls to the configured OPA client', async () => {
    const result = { allowed: true };
    const evaluate = vi.fn().mockResolvedValue(result);
    const opaClient = {
      evaluate,
    } as unknown as OPAClient;
    const service = setup(opaClient);
    const fromResult = vi.fn((value?: Result) => Boolean((value as { allowed?: boolean } | undefined)?.allowed));
    const opts: RequestOptions<boolean> = { fromResult };

    await expect(firstValueFrom(service.evaluate('tickets/allow', { user: 'alice' }, opts))).resolves.toEqual(result);
    expect(evaluate).toHaveBeenCalledWith('tickets/allow', { user: 'alice' }, opts);
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
    const service = setup(opaClient);

    opaClient.set(secondClient);

    await expect(firstValueFrom(service.evaluate('tickets/allow'))).resolves.toBe(true);
    expect(firstEvaluate).not.toHaveBeenCalled();
    expect(secondEvaluate).toHaveBeenCalledWith('tickets/allow', undefined, undefined);
  });
});
