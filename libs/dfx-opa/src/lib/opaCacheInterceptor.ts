import { HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';

import { Observable, shareReplay, tap } from 'rxjs';

const DEBUG = false;

// Cache stores shared observables
const cache = new Map<string, Observable<HttpEvent<unknown>>>();

const OPA_CACHE_HEADER_KEY = 'OPA_CACHE';
export const OPA_CACHE_HEADER = {
  [OPA_CACHE_HEADER_KEY]: 'true',
};

export function opaCacheInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  if (DEBUG) console.warn('cache interceptor run');

  const reqOpaCacheHeader = req.headers.get(OPA_CACHE_HEADER_KEY);
  if (reqOpaCacheHeader === undefined || reqOpaCacheHeader !== 'true') {
    return next(req);
  }

  const url = req.url;
  const cachedResponse = cache.get(url);

  if (DEBUG) console.log(`reading cache of ${url}`, cachedResponse);

  if (cachedResponse) {
    return cachedResponse;
  }

  if (DEBUG) console.log(`creating new request for ${url}`);

  // Create a shared observable that replays the last value
  const sharedRequest = next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && DEBUG) {
        console.log(`caching response for ${url}`);
      }
    }),
    shareReplay(1), // ensures all subscribers share the same request + replay
  );

  cache.set(url, sharedRequest);

  return sharedRequest;
}
