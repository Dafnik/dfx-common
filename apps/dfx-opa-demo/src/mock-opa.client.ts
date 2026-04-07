/* eslint-disable @typescript-eslint/no-unused-vars */
import { Input, OPAClient, RequestOptions, ToInput } from '@open-policy-agent/opa';

export class MockOpaClient extends OPAClient {
  override evaluate<In extends Input | ToInput, Res>(path: string, input?: In, opts?: RequestOptions<Res>): Promise<Res> {
    let value = false;

    // @ts-expect-error Token
    if (path === 'test/Organisationsverwaltung' && input?.['token'] === 'ADMIN') {
      value = true;
    }

    // @ts-expect-error Token
    if (path === 'test/Kundenverwaltung' && (input?.['token'] === 'ADMIN' || input?.['token'] === 'MODERATOR')) {
      value = true;
    }
    // @ts-expect-error Always return a boolean
    return new Promise<Res>((resolve, reject) => resolve(value));
  }
}
