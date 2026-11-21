import { Component, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomBar } from './core/shell/bottom-bar/bottom-bar';
import { isOnChatPage } from './core/shell/is-on-chat-page';
import { TopBar } from './core/shell/top-bar/top-bar';
import { ToastList } from './shared/toasts/toast-list/toast-list';

// A page in the reading column, which scrolls with the window.
const columnMainClass = 'mx-auto w-full max-w-column px-4 py-8';
// The chat: the wide column, exactly as tall as the screen leaves between the bars, so the page's own
// boxes scroll inside it.
const fillingMainClass = 'mx-auto flex min-h-0 w-full max-w-wide flex-1 flex-col px-4 py-4 md:py-6';

// The shell around every page: the top bar, the page in one centred column, the phone's bottom bar for
// a signed-in user, and the toasts. The chat fills the screen instead (isOnChatPage).
@Component({
  imports: [RouterOutlet, TopBar, BottomBar, ToastList],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  host: { '[class]': "fillsScreen() ? 'flex h-dvh flex-col' : 'block'" },
})
export class App {
  protected readonly fillsScreen = isOnChatPage();
  protected readonly mainClass = computed(() =>
    this.fillsScreen() ? fillingMainClass : columnMainClass,
  );
}
