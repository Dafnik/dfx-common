import { OPAClient } from '@open-policy-agent/opa';

export const environment = {
  opaClient: new OPAClient('http://localhost:4200/opa', {
    headers: {
      OPA: 'OPA',
    },
  }),
};
