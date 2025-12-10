export type QuerySerializer<T> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: T extends { parameters: any } ? NonNullable<T['parameters']['query']> : Record<string, unknown>,
) => string;
