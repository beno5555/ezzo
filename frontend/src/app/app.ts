import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomBar } from './core/shell/bottom-bar/bottom-bar';
import { TopBar } from './core/shell/top-bar/top-bar';
import { ToastList } from './shared/toasts/toast-list/toast-list';

// The shell around every page: the top bar, the page in one centred column, the phone's bottom bar for
// a signed-in user, and the toasts.
@Component({
  imports: [RouterOutlet, TopBar, BottomBar, ToastList],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
