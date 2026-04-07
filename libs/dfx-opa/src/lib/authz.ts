import { Injectable, Injector, ResourceRef, Signal, inject, resource, runInInjectionContext } from '@angular/core';

import { Input, OPAClient } from '@open-policy-agent/opa';
import { Result } from '@open-policy-agent/opa';

import { AuthzCache } from './authz-cache';
import { AUTHZ_OPTIONS, AuthzCacheOptions } from './config';
import { resolveValue } from './util';

interface AuthzParams<T> {
  cache?: AuthzCacheOptions;
  opaClient: OPAClient;
  fromResult?: (_?: Result) => T;
  input?: Input;
  path: string;
}

interface AuthzResourceState {
  forceRefresh: boolean;
}

@Injectable({ providedIn: 'root' })
export class Authz {
  private readonly authzCache = inject(AuthzCache);
  private readonly authzOptions = inject(AUTHZ_OPTIONS);
  private readonly injector = inject(Injector);

  evaluate<T>(
    path?: string | Signal<string | undefined>,
    input?: Input | Signal<Input>,
    fromResult?: (_?: Result) => T,
  ): ResourceRef<T | undefined> {
    return runInInjectionContext(this.injector, () => {
      const resourceState: AuthzResourceState = {
        forceRefresh: false,
      };
      const resourceRef = resource<T, AuthzParams<T> | undefined>({
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
            cache: this.authzOptions.cache,
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
        loader: async ({ params }) => {
          if (!params.cache) {
            return params.opaClient.evaluate(params.path, params.input, {
              fromResult: params.fromResult,
            });
          }

          const forceRefresh = resourceState.forceRefresh;
          resourceState.forceRefresh = false;

          const rawResult = await this.authzCache.evaluate(params.opaClient, params.path, params.input, params.cache, {
            forceRefresh,
          });

          return params.fromResult ? params.fromResult(rawResult) : (rawResult as T);
        },
      });

      return new Proxy(resourceRef, {
        get: (target, prop, receiver) => {
          if (prop === 'reload') {
            return () => {
              resourceState.forceRefresh = Boolean(this.authzOptions.cache);

              const didReload = target.reload();

              if (!didReload) {
                resourceState.forceRefresh = false;
              }

              return didReload;
            };
          }

          const value = Reflect.get(target, prop, receiver);
          return typeof value === 'function' ? value.bind(target) : value;
        },
      }) as ResourceRef<T | undefined>;
    });
  }
}
