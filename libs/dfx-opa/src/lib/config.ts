import { InjectionToken, Provider, Signal } from '@angular/core';

import { Input, OPAClient, Result } from '@open-policy-agent/opa';

export interface AuthzOptions {
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
