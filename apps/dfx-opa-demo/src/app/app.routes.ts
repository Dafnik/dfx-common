import { Routes } from '@angular/router';

import { authzCanActivate } from 'dfx-opa';

import { AccessDeniedPage } from './access-denied.page';
import { HomePage } from './home.page';
import { KundenverwaltungPage } from './kundenverwaltung.page';
import { OrganisationsverwaltungPage } from './organisationsverwaltung.page';

function policyGuard(policy: string) {
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
}

export const routes: Routes = [
  {
    path: '',
    component: HomePage,
  },
  {
    path: 'kundenverwaltung',
    canActivate: [policyGuard('test/Kundenverwaltung')],
    component: KundenverwaltungPage,
  },
  {
    path: 'organisationsverwaltung',
    canActivate: [policyGuard('test/Organisationsverwaltung')],
    component: OrganisationsverwaltungPage,
  },
  {
    path: 'access-denied',
    component: AccessDeniedPage,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
