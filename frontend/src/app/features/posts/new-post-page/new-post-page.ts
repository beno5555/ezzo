import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  Router,
  RouterLink,
} from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { filter, firstValueFrom } from 'rxjs';
import { LanguageStore } from '../../../core/languages/language-store';
import { appAddresses } from '../../../core/routing/app-addresses';
import { SessionStore } from '../../../core/session/session-store';
import { Button } from '../../../shared/button/button';
import { NewPost } from '../new-post';
import { isFromProfile } from '../new-post-origin';
import { NewPostStore } from '../new-post-store';
import { PostComposer } from '../post-composer/post-composer';

// The composer's page at /posts/new, opened from the feed's Write a post button, from the profile's, and
// from a refused post's toast. It is a page of its own so that the feed stays a list, and other kinds of
// post can get their own fields here later. A link above the heading leads back without writing anything.
//
// Where it leads back, and where a sent post goes, depends on where the page was opened from:
//   - From the feed (or a toast): the writer's own profile first, where the post shows as pending; the
//     profile already listens when the server answers. The profile takes this page's place in the history,
//     so Back does not return to an empty composer. The link leads to the feed.
//   - From the profile (its button hands over NewPostOrigin in the navigation's state): back one step in the
//     history, which is the profile itself, for the link and for a sent post alike. Navigating to the
//     profile again would stack a second copy of it, and Back would then show the same page twice.
@Component({
  selector: 'app-new-post-page',
  imports: [Button, LucideArrowLeft, PostComposer, RouterLink],
  templateUrl: './new-post-page.html',
  styleUrl: './new-post-page.css',
})
export class NewPostPage {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly newPosts = inject(NewPostStore);
  private readonly sessionStore = inject(SessionStore);

  protected readonly text = inject(LanguageStore).text;
  protected readonly feedAddress = appAddresses.home;
  // Read once, while the navigation to this page is still current.
  protected readonly isFromProfile = isFromProfile(this.router.currentNavigation()?.extras.state);

  async publish(newPost: NewPost): Promise<void> {
    if (this.isFromProfile) {
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

  // The link above the heading when the page came from the profile. Any end of the navigation lets a
  // sent post go on: a step back that a guard cancels must not leave the post unsent.
  async goBack(): Promise<void> {
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
