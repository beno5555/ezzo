import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LanguageSwitch } from './core/languages/language-switch/language-switch';

@Component({
  imports: [RouterOutlet, LanguageSwitch],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
