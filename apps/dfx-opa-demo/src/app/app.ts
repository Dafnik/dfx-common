import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthzDirective, useAuthz } from 'dfx-opa';
import { GithubButton, Layout, NpmButton, ThemeSwitch } from 'playground-lib';

import { DemoTokenService } from './demo-token.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  imports: [AuthzDirective, FormsModule, Layout, GithubButton, NpmButton, ThemeSwitch],
})
export class App {
  globalToken = inject(DemoTokenService).token;

  testPath = signal('test/Organisationsverwaltung');
  testToken = signal('ADMIN');

  protected readonly useAuthzTest = useAuthz<boolean>({
    path: this.testPath,
    input: computed(() => ({ token: this.testToken() })),
  });
}
