import { Injectable } from '@angular/core';

import { Input, OPAClient, Result } from '@open-policy-agent/opa';

import { AuthzCacheOptions } from './config';

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_MAX_ENTRIES = 200;

interface PendingCacheEntry {
  kind: 'pending';
  lastAccessedAt: number;
  promise: Promise<Result>;
}

interface ResolvedCacheEntry {
  expiresAt: number;
  kind: 'resolved';
  lastAccessedAt: number;
  value: Result;
}

type CacheEntry = PendingCacheEntry | ResolvedCacheEntry;

interface NormalizedAuthzCacheOptions {
  maxEntries: number;
  ttlMs: number;
}

@Injectable({ providedIn: 'root' })
export class AuthzCache {
  private readonly cache = new WeakMap<OPAClient, Map<string, CacheEntry>>();

  async evaluate(
    opaClient: OPAClient,
    path: string,
    input: Input | undefined,
    cacheOptions: AuthzCacheOptions,
    { forceRefresh = false }: { forceRefresh?: boolean } = {},
  ): Promise<Result> {
    const options = normalizeCacheOptions(cacheOptions);
    const bucket = this.getBucket(opaClient);
    const key = createCacheKey(path, input);

    this.removeExpiredEntries(bucket);

    const cachedEntry = bucket.get(key);

    if (cachedEntry) {
      if (cachedEntry.kind === 'pending') {
        this.touchEntry(bucket, key, cachedEntry);
        return cachedEntry.promise;
      }

      if (!forceRefresh) {
        this.touchEntry(bucket, key, cachedEntry);
        return cachedEntry.value;
      }
    }

    const promise = opaClient.evaluate<Input, Result>(path, input);
    const pendingEntry: PendingCacheEntry = {
      kind: 'pending',
      lastAccessedAt: Date.now(),
      promise,
    };

    this.setEntry(bucket, key, pendingEntry, options);

    try {
      const value = await promise;
      const resolvedEntry: ResolvedCacheEntry = {
        expiresAt: Date.now() + options.ttlMs,
        kind: 'resolved',
        lastAccessedAt: Date.now(),
        value,
      };

      if (bucket.get(key) === pendingEntry) {
        this.setEntry(bucket, key, resolvedEntry, options);
      }

      return value;
    } catch (error) {
      if (bucket.get(key) === pendingEntry) {
        bucket.delete(key);
      }

      throw error;
    }
  }

  private getBucket(opaClient: OPAClient): Map<string, CacheEntry> {
    let bucket = this.cache.get(opaClient);

    if (!bucket) {
      bucket = new Map<string, CacheEntry>();
      this.cache.set(opaClient, bucket);
    }

    return bucket;
  }

  private removeExpiredEntries(bucket: Map<string, CacheEntry>): void {
    const now = Date.now();

    for (const [key, entry] of bucket.entries()) {
      if (entry.kind === 'resolved' && entry.expiresAt <= now) {
        bucket.delete(key);
      }
    }
  }

  private setEntry(bucket: Map<string, CacheEntry>, key: string, entry: CacheEntry, options: NormalizedAuthzCacheOptions): void {
    if (bucket.has(key)) {
      bucket.delete(key);
    }

    bucket.set(key, entry);

    while (bucket.size > options.maxEntries) {
      const lruKey = bucket.keys().next().value;

      if (lruKey === undefined) {
        return;
      }

      bucket.delete(lruKey);
    }
  }

  private touchEntry(bucket: Map<string, CacheEntry>, key: string, entry: CacheEntry): void {
    entry.lastAccessedAt = Date.now();
    bucket.delete(key);
    bucket.set(key, entry);
  }
}

function normalizeCacheOptions(options: AuthzCacheOptions): NormalizedAuthzCacheOptions {
  return {
    maxEntries: options.maxEntries ?? DEFAULT_MAX_ENTRIES,
    ttlMs: options.ttlMs ?? DEFAULT_TTL_MS,
  };
}

function createCacheKey(path: string, input: Input | undefined): string {
  return `${path}:${stableSerialize(input)}`;
}

function stableSerialize(value: Input | undefined): string {
  if (value === undefined) {
    return 'undefined';
  }

  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue as Input)}`)
    .join(',')}}`;
}
