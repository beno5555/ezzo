import { Component, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BottomBar } from './core/shell/bottom-bar/bottom-bar';
import { isInConversation, isOnChatPage } from './core/shell/is-on-chat-page';
import { TopBar } from './core/shell/top-bar/top-bar';
import { ToastList } from './shared/toasts/toast-list/toast-list';

// A page in the reading column, which scrolls with the window.
const columnMainClass = 'mx-auto w-full max-w-column px-4 py-8';
// The chat: the wide column, exactly as tall as the screen leaves between the bars, so the page's own
// boxes scroll inside it.
const fillingMainClass = 'mx-auto flex min-h-0 w-full max-w-wide flex-1 flex-col px-4 py-4 md:py-6';
// One conversation: on a phone the whole screen, edge to edge, with no bars around it.
const conversationMainClass =
  'mx-auto flex min-h-0 w-full max-w-wide flex-1 flex-col md:px-4 md:py-6';

// The shell around every page: the top bar, the page in one centred column, the phone's bottom bar for
// a signed-in user, and the toasts. The chat fills the screen instead (isOnChatPage), and on a phone one
// conversation hides both bars (isInConversation).
@Component({
  imports: [RouterOutlet, TopBar, BottomBar, ToastList],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
  host: { '[class]': "fillsScreen() ? 'flex h-dvh flex-col' : 'block'" },
})
export class App {
  protected readonly fillsScreen = isOnChatPage();
  protected readonly inConversation = isInConversation();
  protected readonly mainClass = computed(() => {
    let mainClass = columnMainClass;
    if (this.inConversation()) {
      mainClass = conversationMainClass;
    } else if (this.fillsScreen()) {
      mainClass = fillingMainClass;
    }

    return mainClass;
  });
}
