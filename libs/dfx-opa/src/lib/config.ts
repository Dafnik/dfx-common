import { InjectionToken, Provider, Signal } from '@angular/core';

import { Input, OPAClient, Result } from '@open-policy-agent/opa';

/**
 * Optional cache policy for {@link AuthzOptions.cache}.
 *
 * - {@link AuthzCacheOptions.maxEntries} must be a positive integer when provided. If omitted, the
 *   library uses its default maximum cache size.
 * - {@link AuthzCacheOptions.ttlMs} must be a non-negative integer number of milliseconds when provided.
 *   If omitted, the library uses its default TTL. A value of `0` means cached entries expire immediately
 *   after resolution and are only reused while the same request is still in flight.
 */
export interface AuthzCacheOptions {
  maxEntries?: number;
  ttlMs?: number;
}

export interface AuthzOptions {
  cache?: AuthzCacheOptions;
  defaultFromResult?: (_?: Result) => boolean;
  defaultInput?: Input | Signal<Input>;
  defaultPath?: string | Signal<string>;
  opaClient: OPAClient | Signal<OPAClient>;
}

export const AUTHZ_OPTIONS = new InjectionToken<AuthzOptions>('AUTHZ_OPTIONS');

export function provideAuthz(options: AuthzOptions | (() => AuthzOptions)): Provider {
  return {
    provide: AUTHZ_OPTIONS,
    useFactory: typeof options === 'function' ? options : () => options,
  };
}
