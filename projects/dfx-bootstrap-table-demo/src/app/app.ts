import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { ThemePicker } from './theme-picker';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ThemePicker],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
