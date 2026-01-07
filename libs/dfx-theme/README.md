# dfx-theme

`dfx-theme` is a tiny and simple-to-use Angular Theme management library.

[![npm version](https://img.shields.io/npm/v/dfx-theme?label=version&color=%237469B6&cacheSeconds=86400)](https://npmjs.org/package/dfx-theme)
[![npm downloads per week](https://img.shields.io/npm/dw/dfx-theme?logo=npm&color=%237469B6)](https://npmjs.org/package/dfx-theme)
[![npm bundle size](https://img.shields.io/bundlephobia/min/dfx-theme?color=%237469B6&cacheSeconds=86400)](https://npmjs.org/package/dfx-theme)

**[Live Demo](https://playground.dafnik.me/theme/)**

Fork of [@slateui/theme](https://github.com/angularcafe/slateui-theme).

## Features

- Automatic Theme Detection - Supports light, dark, and system themes with OS preference detection
- SSR-safe - No hydration mismatch, works with Angular SSR out of the box
- Flexible Strategies - Choose between class, attribute, color-scheme-based theming
- Tiny (~13kB minified + gzipped)

#### Table of Contents

- [Installation](#installation)
- [Version compatibility](#version-compatibility)
- [Usage](#usage)
- [Configuration](#configuration)

## Version compatibility

| Angular | dfx-theme |
| ------- | --------- |
| 21.x.x  | 21.x.x    |

## Installation

- npm
  ```bash
  npm install dfx-theme
  ```
- pnpm
  ```bash
  pnpm install dfx-theme
  ```

## Usage

Add the theme provider to your `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';

import { provideTheme, withThemeStorage } from 'dfx-theme';

export const appConfig: ApplicationConfig = {
  providers: [provideTheme(withThemeStorage())],
};
```

### Use in Components

```typescript
import { Component, inject } from '@angular/core';

import { ThemeService } from 'dfx-theme';

@Component({
  selector: 'app-header',
  template: `
    <header>
      <h1>My App</h1>
      <button (click)="toggleTheme()">Toggle Theme</button>
      <p>Current theme: {{ themeService.theme() }}</p>
      <p>Resolved theme: {{ themeService.resolvedTheme() }}</p>
    </header>
  `,
})
export class HeaderComponent {
  private themeService = inject(ThemeService);

  toggleTheme() {
    this.themeService.toggle();
  }
}
```

### Add CSS for Theming

```css
/* Default styles (light theme) */
:root {
  --bg-color: #ffffff;
  --text-color: #000000;
  --primary-color: #3b82f6;
}

/* Dark theme styles */
.dark {
  --bg-color: #1f2937;
  --text-color: #f9fafb;
  --primary-color: #60a5fa;
}

body {
  background-color: var(--bg-color);
  color: var(--text-color);
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
}
```

### How to Prevent Theme Flash (FOUC) with an Inline Script

Add this **inline** script to your `index.html` `<head>`:

```html
<!-- Flash Prevention - Prevents FOUC in all browsers -->
<script>
  (function () {
    'use strict';
    try {
      const t = localStorage.getItem('theme') || 'system';
      const e =
        t === 'system'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : t === 'light' || t === 'dark'
            ? t
            : 'light';
      const n = document.documentElement;
      if (n) {
        n.classList.remove('light', 'dark');
        if (e === 'dark') {
          n.classList.add('dark');
          n.setAttribute('data-theme', 'dark');
        } else {
          n.classList.add('light');
          n.setAttribute('data-theme', 'light');
        }
        n.style.colorScheme = e;
      }
    } catch (e) {
      try {
        const n = document.documentElement;
        if (n) {
          n.classList.remove('dark');
          n.setAttribute('data-theme', 'light');
          n.style.colorScheme = 'light';
        }
      } catch (e) {}
    }
  })();
</script>
```

**Why inline?** Angular does not provide a way to inject scripts into the HTML `<head>` at build time. For true FOUC prevention, the script must run immediately as the HTML is parsed—before any content is rendered. External scripts or Angular providers/services run too late to prevent a flash. This is why the script must be copied directly into your `index.html` head.

**Note:** This approach is SSR-safe: the initial HTML uses the default theme, and the correct theme is applied instantly on page load.

#### FAQ: SSR, LocalStorage, and Theme Flash

- The SSR HTML always uses the default theme, since user preferences are only available in the browser.
- The inline script applies the correct theme instantly on page load, so users never see a flash of the wrong theme.
- This is the standard, SSR-safe approach used by modern theme libraries (like next-themes).

## Configuration

```typescript
interface ThemeConfig {
  defaultTheme?: 'light' | 'dark' | 'system'; // Default: 'system'
  enableAutoInit?: boolean; // Default: true
  enableSystem?: boolean; // Default: true
  forcedTheme?: 'light' | 'dark' | 'system'; // Default: undefined
}
```

### Strategies

By default, dfx-theme uses both Class and Color scheme strategies to apply themes.

```typescript
import { provideTheme } from 'dfx-theme';

provideTheme();
```

```typescript
import { provideTheme, themeClassStrategy, themeColorSchemeStrategy, withThemeStrategies } from 'dfx-theme';

provideTheme(
  withThemeStrategies([
    themeColorSchemeStrategy, // used by default
    themeClassStrategy, // used by default
  ]),
);
```

#### Class Strategy

```typescript
import { provideTheme, themeClassStrategy, withThemeStrategies } from 'dfx-theme';

provideTheme(withThemeStrategies([themeClassStrategy]));
```

```css
/* CSS */
.dark {
  --bg-color: #1f2937;
  --text-color: #f9fafb;
}
```

```html
<!-- HTML -->
<html class="dark">
  <!-- Dark theme applied -->
</html>
```

#### Attribute Strategy

```typescript
import { provideTheme, themeAttributeStrategy, withThemeStrategies } from 'dfx-theme';

provideTheme(withThemeStrategies([themeAttributeStrategy]));
```

```css
/* CSS */
[data-theme='dark'] {
  --bg-color: #1f2937;
  --text-color: #f9fafb;
}
```

```html
<!-- HTML -->
<html data-theme="dark">
  <!-- Dark theme applied -->
</html>
```

#### Color scheme Strategy

```typescript
import { provideTheme, themeColorSchemeStrategy, withThemeStrategies } from 'dfx-theme';

provideTheme(withThemeStrategies([themeColorSchemeStrategy]));
```

```css
@media (prefers-color-scheme: dark) {
  --bg-color: #1f2937;
  --text-color: #f9fafb;
}
```

```html
<!-- HTML -->
<html>
  <!-- Dark theme applied -->
</html>
```

#### Custom

```typescript
import { ResolvedTheme, provideTheme, withThemeStrategies } from 'dfx-theme';

provideTheme(
  withThemeStrategies([
    (element: HTMLElement, theme: ResolvedTheme) => {
      // your custom strategy
      element.style.colorScheme = theme;
    },
  ]),
);
```

### LocalStorage support

```typescript
import { LocalStorageManager, provideTheme, withThemeStorage } from 'dfx-theme';

provideTheme(withThemeStorage());

// OR to cutomize

provideTheme(
  withThemeStorage({
    key: 'custom-theme-key', // Default is 'theme'
    storageManager: new LocalStorageManager(), // Default is LocalStorageManager
  }),
);
```

### Other

#### Disable System Detection

```typescript
import { provideTheme } from 'dfx-theme';

provideTheme({
  enableSystem: false,
});
```

#### Forced Theme (for demos)

```typescript
import { provideTheme } from 'dfx-theme';

provideTheme({
  forcedTheme: 'dark',
});
```

## API Reference

### ThemeService

#### Properties

- `theme()` - Readonly signal for current theme setting
- `systemTheme()` - Readonly signal for system theme preference
- `resolvedTheme()` - Computed signal for the actual applied theme
- `initialized` - Boolean property indicating if service is initialized
- `isForced` - Boolean property indicating if forced theme is active

#### Methods

- `setTheme(theme: 'light' | 'dark' | 'system')` - Set the theme
- `toggle()` - Cycle through themes (light → dark → system)
- `isDark()` - Check if current theme is dark
- `isLight()` - Check if current theme is light
- `isSystem()` - Check if using system theme
- `getConfig()` - Get current configuration
- `cleanup()` - Manual cleanup (automatically called on destroy)

### Example Usage

```typescript
import { Component, inject } from '@angular/core';

import { ThemeService } from 'dfx-theme';

@Component({
  selector: 'app-example',
  template: `
    <div>
      <h1>Theme Demo</h1>

      <div class="theme-info">
        <p>Current setting: {{ themeService.theme() }}</p>
        <p>System preference: {{ themeService.systemTheme() }}</p>
        <p>Applied theme: {{ themeService.resolvedTheme() }}</p>
        <p>Is dark mode: {{ themeService.isDark() ? 'Yes' : 'No' }}</p>
      </div>

      <div class="theme-controls">
        <button (click)="themeService.setTheme('light')">Light</button>
        <button (click)="themeService.setTheme('dark')">Dark</button>
        <button (click)="themeService.setTheme('system')">System</button>
        <button (click)="themeService.toggle()">Toggle</button>
      </div>
    </div>
  `,
})
export class ExampleComponent {
  private themeService = inject(ThemeService);
}
```

## Lifecycle Management

The ThemeService automatically handles cleanup when the application is destroyed. However, you can also manually manage the lifecycle:

### Manual Cleanup

```typescript
import { Component, OnDestroy, inject } from '@angular/core';

import { ThemeService } from 'dfx-theme';

@Component({
  selector: 'app-example',
  template: `
    ...
  `,
})
export class ExampleComponent implements OnDestroy {
  private themeService = inject(ThemeService);

  ngOnDestroy() {
    // Manual cleanup (optional - automatic cleanup is handled)
    this.themeService.cleanup();
  }
}
```

## Advanced Usage

### Manual Initialization

```typescript
import { ThemeService, provideTheme } from 'dfx-theme';

provideTheme({
  enableAutoInit: false,
});

// In your component
export class AppComponent implements OnInit {
  private themeService = inject(ThemeService);

  ngOnInit() {
    // Initialize when ready
    this.themeService.initialize();
  }
}
```

### Conditional Initialization

```typescript
import { provideTheme, ThemeService } from 'dfx-theme';

provideTheme({
  enableAutoInit: false
})

// Initialize based on conditions
ngOnInit() {
  if (this.shouldInitializeTheme()) {
    this.themeService.initialize();
  }
}
```

By [Dafnik](https://dafnik.me)
