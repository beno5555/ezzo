import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  Router,
} from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import { LanguageStore } from '../../../core/languages/language-store';
import { appAddresses } from '../../../core/routing/app-addresses';
import { NavigationHistoryStore } from '../../../core/routing/navigation-history-store';
import { SessionStore } from '../../../core/session/session-store';
import { BackLink } from '../../../shared/back-link/back-link';
import { NewPost } from '../new-post';
import { isFromProfile } from '../new-post-origin';
import { NewPostStore } from '../new-post-store';
import { PostComposer } from '../post-composer/post-composer';

// The composer's page at /posts/new, opened from the feed's Write a post button, from the profile's, and
// from a refused post's toast. It is a page of its own so that the feed stays a list, and other kinds of
// post can get their own fields here later. The Back link above the heading (BackLink) leads back to the
// page the reader came from, or to the feed when the page was opened directly, without writing anything.
//
// Where a sent post goes depends on where the page was opened from:
//   - From the feed (or a toast): the writer's own profile first, where the post shows as pending; the
//     profile already listens when the server answers. The profile takes this page's place in the history,
//     so Back does not return to an empty composer.
//   - From the profile (its button hands over NewPostOrigin in the navigation's state): back one step in the
//     history, which is the profile itself. Navigating to the profile again would stack a second copy of
//     it, and Back would then show the same page twice. After a reload of this page the profile is no
//     longer behind it (NavigationHistoryStore says so), and the post goes the way it does from the feed.
@Component({
  selector: 'app-new-post-page',
  imports: [BackLink, PostComposer],
  templateUrl: './new-post-page.html',
  styleUrl: './new-post-page.css',
})
export class NewPostPage {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly newPosts = inject(NewPostStore);
  private readonly sessionStore = inject(SessionStore);
  private readonly history = inject(NavigationHistoryStore);

  protected readonly text = inject(LanguageStore).text;
  // Read once, while the navigation to this page is still current.
  private readonly isFromProfile = isFromProfile(this.router.currentNavigation()?.extras.state);

  async publish(newPost: NewPost): Promise<void> {
    // After a reload the profile is no longer behind this page, though the history state still says so.
    const isProfileBehind = this.isFromProfile && this.history.canGoBack();

    if (isProfileBehind) {
      await this.goBack();
    } else {
      const username = this.sessionStore.user()?.username;
      // The writer's own profile, where the post shows; the feed if the name is not known.
      const destination =
        username === undefined ? [appAddresses.home] : appAddresses.profile(username);

      await this.router.navigate(destination, { replaceUrl: true });
    }
    await this.newPosts.publish(newPost);
  }

  // One step back in the history. Any end of the navigation lets a sent post go on: a step back that a
  // guard cancels must not leave the post unsent.
  private async goBack(): Promise<void> {
    const arrived = firstValueFrom(
      this.router.events.pipe(
        filter(
          (event) =>
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError ||
            event instanceof NavigationSkipped,
        ),
      ),
    );

    this.location.back();
    await arrived;
  }
}
