import { Injector, Signal, computed, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  CanActivateFn,
  CanMatchFn,
  GuardResult,
  PartialMatchRouteSnapshot,
  RedirectCommand,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
} from '@angular/router';

import { filter, firstValueFrom, take } from 'rxjs';

import { Input, Result } from '@open-policy-agent/opa';

import { Authz } from './authz';

const PENDING_GUARD_RESULT = Symbol('PENDING_GUARD_RESULT');

type PendingGuardResult = typeof PENDING_GUARD_RESULT;

export interface AuthzRouteGuardContext {
  route: ActivatedRouteSnapshot;
  router: Router;
  state: RouterStateSnapshot;
}

export interface AuthzMatchGuardContext {
  currentSnapshot?: PartialMatchRouteSnapshot;
  route: Route;
  router: Router;
  segments: UrlSegment[];
}

export type AuthzGuardValue<T, TContext> = T | ((context: TContext) => T);

export type AuthzGuardFromResult<TContext> = (result: Result | undefined, context: TContext) => GuardResult;

export type AuthzGuardOnError<TContext> = (error: unknown, context: TContext) => GuardResult;

export interface AuthzGuardOptions<TContext> {
  fromResult?: AuthzGuardFromResult<TContext>;
  input?: AuthzGuardValue<Input | undefined, TContext>;
  onError?: AuthzGuardOnError<TContext>;
  path?: AuthzGuardValue<string | undefined, TContext>;
}

export interface AuthzGuardRouteData<TContext> {
  authz?: AuthzGuardOptions<TContext>;
}

export function authzCanActivate(options?: AuthzGuardOptions<AuthzRouteGuardContext>): CanActivateFn {
  return (route, state) => {
    const router = inject(Router);

    return runAuthzGuard({
      context: {
        route,
        router,
        state,
      },
      options,
      routeDataOptions: getSnapshotGuardOptions(route),
    });
  };
}

export function authzCanActivateChild(options?: AuthzGuardOptions<AuthzRouteGuardContext>): CanActivateChildFn {
  return (route, state) => {
    const router = inject(Router);

    return runAuthzGuard({
      context: {
        route,
        router,
        state,
      },
      options,
      routeDataOptions: getSnapshotGuardOptions(route),
    });
  };
}

export function authzCanMatch(options?: AuthzGuardOptions<AuthzMatchGuardContext>): CanMatchFn {
  return (route, segments, currentSnapshot) => {
    const router = inject(Router);

    return runAuthzGuard({
      context: {
        currentSnapshot,
        route,
        router,
        segments,
      },
      options,
      routeDataOptions: getRouteGuardOptions(route),
    });
  };
}

function runAuthzGuard<TContext>({
  context,
  options,
  routeDataOptions,
}: {
  context: TContext;
  options?: AuthzGuardOptions<TContext>;
  routeDataOptions?: AuthzGuardOptions<TContext>;
}): Promise<GuardResult> {
  const authz = inject(Authz);
  const injector = inject(Injector);

  const path = toAuthzGuardSignal(pickDefined(options?.path, routeDataOptions?.path), context);
  const input = toAuthzGuardSignal(pickDefined(options?.input, routeDataOptions?.input), context);
  const fromResult = bindFromResult(pickDefined(options?.fromResult, routeDataOptions?.fromResult), context);
  const onError = pickDefined(options?.onError, routeDataOptions?.onError);

  const authzResult = authz.evaluate<GuardResult | Result>(path, input, fromResult);
  const settledResult = computed<GuardResult | PendingGuardResult>(() => {
    if (authzResult.isLoading()) {
      return PENDING_GUARD_RESULT;
    }

    if (authzResult.status() === 'error') {
      return normalizeGuardResult(onError ? onError(authzResult.error(), context) : false);
    }

    if (!authzResult.hasValue()) {
      return false;
    }

    return normalizeGuardResult(authzResult.value());
  });

  return firstValueFrom(
    toObservable(settledResult, { injector }).pipe(
      filter((result): result is GuardResult => result !== PENDING_GUARD_RESULT),
      take(1),
    ),
  );
}

function bindFromResult<TContext>(
  fromResult: AuthzGuardFromResult<TContext> | undefined,
  context: TContext,
): ((_?: Result) => GuardResult) | undefined {
  if (!fromResult) {
    return undefined;
  }

  return (result) => fromResult(result, context);
}

function getRouteGuardOptions<TContext>(route: Pick<Route, 'data'>): AuthzGuardOptions<TContext> | undefined {
  return route.data?.['authz'] as AuthzGuardOptions<TContext> | undefined;
}

function getSnapshotGuardOptions<TContext>(
  route: Pick<ActivatedRouteSnapshot, 'data' | 'routeConfig'>,
): AuthzGuardOptions<TContext> | undefined {
  return (route.routeConfig?.data?.['authz'] ?? route.data['authz']) as AuthzGuardOptions<TContext> | undefined;
}

function normalizeGuardResult(result: GuardResult | Result | undefined): GuardResult {
  if (typeof result === 'boolean' || result instanceof UrlTree || result instanceof RedirectCommand) {
    return result;
  }

  return false;
}

function pickDefined<T>(...values: (T | undefined)[]): T | undefined {
  return values.find((value) => value !== undefined);
}

function resolveGuardValue<T, TContext>(value: AuthzGuardValue<T, TContext>, context: TContext): T | undefined {
  if (typeof value === 'function') {
    return (value as (currentContext: TContext) => T)(context);
  }

  return value;
}

function toAuthzGuardSignal<T, TContext>(
  value: AuthzGuardValue<T | undefined, TContext> | undefined,
  context: TContext,
): Signal<T | undefined> | undefined {
  if (value === undefined) {
    return undefined;
  }

  return computed(() => resolveGuardValue(value, context));
}
