export const routeGuardSnippetFunction = `function policyGuard(policy: string) {
  return authzCanActivate({
    fromResult: (result, { router, state }) =>
      result === true
        ? true
        : router.createUrlTree(['/access-denied'], {
            queryParams: {
              from: state.url,
              policy,
              reason: 'denied',
            },
          }),
    onError: (_error, { router, state }) =>
      router.createUrlTree(['/access-denied'], {
        queryParams: {
          from: state.url,
          policy,
          reason: 'error',
        },
      }),
    path: policy,
  });
}`;
