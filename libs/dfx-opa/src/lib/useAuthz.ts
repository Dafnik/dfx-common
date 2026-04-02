import { Injector, Signal, inject, isSignal, runInInjectionContext, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { Observable, catchError, combineLatest, filter, map, of, switchMap, tap } from 'rxjs';

import { Input, Result } from '@open-policy-agent/opa';

import { Authz } from './authz';
import { AUTHZ_OPTIONS } from './config';

type UseAuthzResult<T> =
  | { isLoading: true; result: undefined; error: undefined }
  | { isLoading: false; result: T; error: undefined }
  | { isLoading: false; result: undefined; error: Error };

const loadingState = {
  error: undefined,
  isLoading: true as const,
  result: undefined,
};

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
}): Signal<UseAuthzResult<T>> {
  return runInInjectionContext(injector, () => {
    const authz = inject(Authz);
    const authzOptions = inject(AUTHZ_OPTIONS);
    const nullSafePath = path ?? authzOptions.defaultPath;
    if (!nullSafePath) {
      return signal({
        error: new Error(`[authzDirective] No defaultPath or path was given. "${path}"`),
        isLoading: false,
        result: undefined,
      });
    }

    const extractedPath$ = isSignal(nullSafePath) ? toObservable(nullSafePath) : of(nullSafePath);

    const extractedInput$ = input ? (isSignal(input) ? toObservable<Input>(input as Signal<Input>) : of(input)) : of(undefined);

    const extractedDefaultInput$ = authzOptions.defaultInput
      ? isSignal(authzOptions.defaultInput)
        ? toObservable<Input>(authzOptions.defaultInput as Signal<Input>)
        : of(authzOptions.defaultInput)
      : of(undefined);

    const state = signal<UseAuthzResult<T>>(loadingState);

    combineLatest([extractedPath$, extractedInput$, extractedDefaultInput$])
      .pipe(
        takeUntilDestroyed(),
        filter((it): it is [string, Input | undefined, Input | undefined] => {
          if (!it[0]) {
            console.error(new Error(`[authzDirective] No defaultPath or path was given. "${path}"`));
            return false;
          }

          return true;
        }),
        tap(() => state.set(loadingState)),
        switchMap(([extractedPath, extractedInput, extractedDefaultInput]) =>
          authz.evaluate(
            extractedPath,
            typeof extractedInput === 'object'
              ? {
                  // @ts-expect-error defaultInput is going to be an object if other inputs are an object
                  ...extractedDefaultInput,
                  ...extractedInput,
                }
              : (extractedInput ?? extractedDefaultInput),
            {
              fromResult: fromResult ?? (authzOptions.defaultFromResult as ((_?: Result) => T) | undefined),
            },
          ),
        ),
        map(
          (result): UseAuthzResult<T> => ({
            error: undefined,
            isLoading: false,
            result,
          }),
        ),
        catchError(
          (error): Observable<UseAuthzResult<T>> =>
            of({
              error: error instanceof Error ? error : new Error(String(error)),
              isLoading: false,
              result: undefined,
            }),
        ),
      )
      .subscribe((it) => state.set(it));

    return state;
  });
}
