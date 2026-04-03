import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DemoTokenService {
  token = signal('MODERATOR');
}
