import { MediaType, Readable, ResponseObjectMap, SuccessResponse } from 'openapi-typescript-helpers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type HttpClientResponse<T extends Record<string | number, any>, Media extends MediaType> = Readable<
  SuccessResponse<ResponseObjectMap<T>, Media>
>;
