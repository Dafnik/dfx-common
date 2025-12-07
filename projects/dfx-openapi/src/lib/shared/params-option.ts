import { RequiredKeysOf } from 'openapi-typescript-helpers';

import { DefaultParamsOption } from './default-params-option';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ParamsOption<T> = T extends { parameters: any }
  ? RequiredKeysOf<T['parameters']> extends never
    ? { params?: T['parameters'] }
    : { params: T['parameters'] }
  : DefaultParamsOption;
