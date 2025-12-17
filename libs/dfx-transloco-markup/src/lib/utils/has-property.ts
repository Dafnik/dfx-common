export function hasProperty<S, T extends string>(subject: S, key: T): subject is S & Record<T, unknown> {
  return typeof subject === 'object' && subject !== null && key in subject;
}
