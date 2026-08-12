import { IsOperationRequestBodyOptional, OperationRequestBodyContent, Writable } from 'openapi-typescript-helpers';

// For `multipart/form-data` endpoints the generated schema describes the body as a
// structured object, but at runtime multipart payloads must be sent as a `FormData`
// instance (Angular's HttpClient serializes it with the correct boundary/headers).
// FormData cannot be statically shape-checked, so we accept any `FormData` here as an
// intentional escape hatch whenever the operation advertises a `multipart/form-data` body.
type MultipartFormData<T> = T extends { requestBody?: infer RequestBody }
  ? NonNullable<RequestBody> extends { content: infer Content }
    ? 'multipart/form-data' extends keyof Content
      ? FormData
      : never
    : never
  : never;

// Enum and string-literal-union bodies (e.g. `'USER_REQUEST' | 'PROVIDER_DECISION'`) are
// commonly sent pre-serialized via `JSON.stringify(...)`, whose return type is always the
// wide `string`. To let callers pass that serialized value we widen these bodies to `string`.
// Tradeoff: this erases literal-type checking for such endpoints, so an unrelated string or a
// typo (e.g. `JSON.stringify('WRONG_VALUE')`) also compiles. Object bodies are unaffected —
// `Extract<object, string>` is `never`, so they keep their structured type (see the
// "does not widen object bodies to strings" test).
type SerializedStringBody<T> = Extract<NonNullable<OperationRequestBodyContent<T>>, string> extends never ? never : string;

type RequestBody<T> = OperationRequestBodyContent<T> | MultipartFormData<T> | SerializedStringBody<T>;

// Writable<T> strips $Read markers (readOnly properties excluded from request body)
export type RequestBodyOption<T> =
  Writable<OperationRequestBodyContent<T>> extends never
    ? { body?: never }
    : IsOperationRequestBodyOptional<T> extends true
      ? { body?: Writable<RequestBody<T>> }
      : { body: Writable<RequestBody<T>> };
