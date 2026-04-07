import { Component, inject } from '@angular/core';

import { Layout } from './layout';

@Component({
  template: `
    <a
      class="btn-outline border-gray-900"
      href="https://npmjs.com/package/{{ project() }}"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="View {{ project() }} on npm">
      <svg class="h-3" id="npm" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 780 250">
        <style type="text/css">
          .st0 {
            fill: #c12127;
          }
        </style>
        <path
          class="st0"
          d="M240,250h100v-50h100V0H240V250z M340,50h50v100h-50V50z M480,0v200h100V50h50v150h50V50h50v150h50V0H480z
	 M0,200h100V50h50v150h50V0H0V200z" />
      </svg>
      <span class="sr-only">npm</span>
    </a>
  `,
  selector: 'playground-npm-button',
})
export class NpmButton {
  project = inject(Layout).project;
}
