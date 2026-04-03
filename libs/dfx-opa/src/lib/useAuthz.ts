import { Injector, ResourceRef, Signal, inject, runInInjectionContext } from '@angular/core';

import { Input, Result } from '@open-policy-agent/opa';

import { Authz } from './authz';

export function useAuthz<T>({
  path,
  input,
  fromResult,
  injector = inject(Injector),
}: {
  path?: string | Signal<string | undefined>;
  input?: Input | Signal<Input>;
  fromResult?: (_?: Result) => T;
  injector?: Injector;
}): ResourceRef<T | undefined> {
  return runInInjectionContext(injector, () => {
    const authz = inject(Authz);

    return authz.evaluate(path, input, fromResult);
  });
}
