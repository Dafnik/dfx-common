# dfx-opa

[![npm version](https://img.shields.io/npm/v/dfx-opa?label=version&color=%237469B6&cacheSeconds=86400)](https://npmjs.org/package/dfx-opa)
[![npm downloads per week](https://img.shields.io/npm/dw/dfx-opa?logo=npm&color=%237469B6)](https://npmjs.org/package/dfx-opa)
[![npm bundle size](https://img.shields.io/bundlephobia/min/dfx-opa?color=%237469B6&cacheSeconds=86400)](https://npmjs.org/package/dfx-opa)

This package contains helpers for using [@open-policy-agent/opa](https://www.npmjs.com/package/@open-policy-agent/opa) from Angular.

## Features

- High-level, declarative components for embedding authorization decisions in your frontend code.
- Built-in state management.

### Version compatibility

| Angular | dfx-opa | @open-policy-agent/opa |
| ------- | ------- | ---------------------- |
| 21.x.x  | 21.x.x  | 2.x.x                  |

## Installation

- npm
  ```bash
  npm install dfx-opa
  ```
- pnpm
  ```bash
  pnpm install dfx-opa
  ```

## Scaffolding: `provideAuthz`

To be able to use the `*authz` component and `useAuthz` function, the application needs to be able to access the `AUTHZ_OPTIONS`.
The simplest way to make that happen is to provide it in your `app.config.ts`.

Add these imports to the file that defines your `ApplicationConfig`:

```js
import { OPAClient } from '@open-policy-agent/opa';
import { provideAuthz } from 'dfx-opa';
```

Then instantiate an `OPAClient` that is able to reach your OPA server, and pass that along to `provideAuthz`:

```ts
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

const serverURL = 'https://opa.internal';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAuthz(() => {
      // other initialization logic
      return {
        opaClient: new OPAClient(serverURL),
      };
    }),
  ],
};
```

> [!NOTE]
> Only `opaClient` is mandatory.

If your OPA instance is reverse-proxied with a prefix of `/opa/` instead, you can use `window.location` to configure the `OPAClient`:

```ts
provideAuthz(() => {
  const href = window.location.toString();
  const u = new URL(href);
  u.pathname = 'opa'; // if /opa/* is reverse-proxied to your OPA service
  u.search = '';
  return {
    opaClient: new OPAClient(u.toString()),
  };
});
```

To provide a user-specific header, let's say from your frontend's authentication machinery, you could do this:

```ts
import { computed, inject } from '@angular/core';

provideAuthz(() => {
  const authService = inject(AuthService); // assuming there's some service for authentication
  return {
    opaClient: computed(
      () =>
        new OPAClient(serverURL, {
          headers: {
            'X-Tenant': authService.tenant(),
            'X-User': authService.user(),
          },
        }),
    ),
  };
});
```

## Controlling UI elements

The `*authz` directive provides a high-level approach to letting your UI react to policy evaluation results.

For example, to disable a button based on the outcome of a policy evaluation of `data.things.allow` with input `{"action": "delete", "resource": "thing"}`, you would add this to your template:

```angular2html
<button *authz="'things/allow'; input: { action: 'delete', resouce: 'thing'}; else #fallback">
  Delete Thing
</button>
<ng-template #fallback>
  <button disabled>Delete Thing</button>
</ng-template>
```

> [!NOTE]
>
> - `loading` allows you to control what's rendered while still waiting for a result.
> - `path` and `fromResult` can fall back to `defaultPath` and `defaultFromResult` of `AUTHZ_OPTIONS` respectively, and
> - `input` can be merged with the `defaultInput` of `AUTHZ_OPTIONS`.

## Full control: `useAuthz` hook

`*authz` is a convenience-wrapper around the `useAuthz` function.
If it is insufficient for your use case, you can reach to `useAuthz` for more control.

### Avoid repetition of controlled UI elements in code

In the example above, we had to define `<button>` twice: once for when the user is authorized, and as `fallback` when they are not.
We can avoid this by using `useAuthz`:

```ts
@Component({
  template: `
    @if (authzResult.result) {
      <button>Delete Thing</button>
    } @else if (authzResult.isLoading) {
      Loading...
    } @else {
      <button disabled>Delete Thing</button>
    }
  `,
})
export class MyComponent {
  protected readonly authzResult = useAuthz('things/allow', {
    action: 'delete',
    resource: 'thing',
  });
}
```

By [Dafnik](https://dafnik.me)
