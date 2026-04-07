import { Signal, isSignal } from '@angular/core';

export function resolveValue<T>(value: T | Signal<T>): T {
  return isSignal(value) ? value() : value;
}
