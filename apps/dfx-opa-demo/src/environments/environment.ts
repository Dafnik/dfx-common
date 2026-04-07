import { MockOpaClient } from '../mock-opa.client';

export const environment = {
  opaClient: new MockOpaClient('https://localhost'),
};
