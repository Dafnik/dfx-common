import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthzDirective, useAuthz } from 'dfx-opa';

import { DemoTokenService } from './demo-token.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [AuthzDirective, FormsModule],
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
