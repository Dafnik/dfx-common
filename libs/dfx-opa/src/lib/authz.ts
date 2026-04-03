import { Injectable, Injector, ResourceRef, Signal, inject, isSignal, resource, runInInjectionContext } from '@angular/core';

import { Input, OPAClient } from '@open-policy-agent/opa';
import { Result } from '@open-policy-agent/opa';

import { AUTHZ_OPTIONS } from './config';

function resolveValue<T>(value: T | Signal<T>): T {
  return isSignal(value) ? value() : value;
}

interface AuthzParams<T> {
  opaClient: OPAClient;
  fromResult?: (_?: Result) => T;
  input?: Input;
  path: string;
}

@Injectable({ providedIn: 'root' })
export class Authz {
  private readonly authzOptions = inject(AUTHZ_OPTIONS);
  private readonly injector = inject(Injector);

  evaluate<T>(
    path?: string | Signal<string | undefined>,
    input?: Input | Signal<Input>,
    fromResult?: (_?: Result) => T,
  ): ResourceRef<T | undefined> {
    return runInInjectionContext(this.injector, () => {
      return resource<T, AuthzParams<T> | undefined>({
        injector: this.injector,
        params: () => {
          const resolvedPathSource = path ?? this.authzOptions.defaultPath;
          const resolvedPath = resolvedPathSource ? resolveValue(resolvedPathSource) : undefined;

          if (!resolvedPath) {
            return undefined;
          }

          const resolvedInput = input ? resolveValue(input) : undefined;
          const resolvedDefaultInput = this.authzOptions.defaultInput ? resolveValue(this.authzOptions.defaultInput) : undefined;

          return {
            opaClient: resolveValue(this.authzOptions.opaClient),
            fromResult: fromResult ?? (this.authzOptions.defaultFromResult as ((_?: Result) => T) | undefined),
            input:
              typeof resolvedInput === 'object'
                ? {
                    // @ts-expect-error defaultInput is going to be an object if other inputs are an object
                    ...resolvedDefaultInput,
                    ...resolvedInput,
                  }
                : (resolvedInput ?? resolvedDefaultInput),
            path: resolvedPath,
          };
        },
        loader: ({ params }) =>
          params.opaClient.evaluate(params.path, params.input, {
            fromResult: params.fromResult,
          }),
      });
    });
  }
}
