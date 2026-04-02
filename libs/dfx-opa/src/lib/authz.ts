import { Injectable, Signal, inject, isSignal, signal } from '@angular/core';

import { Observable, from } from 'rxjs';

import { Input, OPAClient, RequestOptions, ToInput } from '@open-policy-agent/opa';

import { AUTHZ_OPTIONS } from './config';

@Injectable({ providedIn: 'root' })
export class Authz {
  private readonly authzOptions = inject(AUTHZ_OPTIONS);
  private readonly opaClient: Signal<OPAClient>;

  constructor() {
    const opaClient = this.authzOptions.opaClient;
    if (isSignal(opaClient)) {
      this.opaClient = opaClient;
    } else {
      this.opaClient = signal(opaClient);
    }
  }

  evaluate<Res>(path: string, input?: Input | ToInput, opts?: RequestOptions<Res>): Observable<Res> {
    return from(this.opaClient().evaluate(path, input, opts));
  }
}
