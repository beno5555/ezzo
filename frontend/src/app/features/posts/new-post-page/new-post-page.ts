import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { appAddresses } from '../../../core/routing/app-addresses';
import { SessionStore } from '../../../core/session/session-store';
import { Button } from '../../../shared/button/button';
import { NewPost } from '../new-post';
import { NewPostStore } from '../new-post-store';
import { PostComposer } from '../post-composer/post-composer';

// The composer's page at /posts/new, opened from the feed's Write a post button and from a refused
// post's toast. It is a page of its own so that the feed stays a list, and other kinds of post can get
// their own fields here later. Sending goes to the writer's own profile first, where the post shows as pending;
// the profile already listens when the server answers. The profile takes this page's place in the history, so Back
// does not return to an empty composer. A link above the heading leads back to the feed without
// writing anything.
@Component({
  selector: 'app-new-post-page',
  imports: [Button, LucideArrowLeft, PostComposer, RouterLink],
  templateUrl: './new-post-page.html',
  styleUrl: './new-post-page.css',
})
export class NewPostPage {
  private readonly router = inject(Router);
  private readonly newPosts = inject(NewPostStore);
  private readonly sessionStore = inject(SessionStore);

  protected readonly text = inject(LanguageStore).text;
  protected readonly feedAddress = appAddresses.feed;

  async publish(newPost: NewPost): Promise<void> {
    const username = this.sessionStore.user()?.username;
    // The writer's own profile, where the post shows; the feed if the name is not known.
    const destination =
      username === undefined ? [appAddresses.feed] : appAddresses.profile(username);

    await this.router.navigate(destination, { replaceUrl: true });
    await this.newPosts.publish(newPost);
  }
}
