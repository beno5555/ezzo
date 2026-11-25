import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastLook } from '../../shared/toasts/toast-look';
import { ToastStore } from '../../shared/toasts/toast-store';
import { NotifyCommentDto } from '../../features/comments/notify-comment-dto';
import { PresenceStore } from '../../features/friendships/presence-store';
import { ConversationsStore } from '../../features/messages/conversations-store';
import { PushMessageDto } from '../../features/messages/push-message-dto';
import { PostLikedDto } from '../../features/posts/post-liked-dto';
import { LanguageStore } from '../languages/language-store';
import { appAddresses } from '../routing/app-addresses';
import { minuteInMilliseconds } from '../time/minute-clock';

// A friend who comes online shows one toast, then none for 5 minutes (spec, Toasts). A reload goes
// offline and online again, and must not produce a toast each time.
const onlineToastQuietMilliseconds = 5 * minuteInMilliseconds;

// How much of a message a toast shows, in characters.
const messagePreviewLength = 60;

const ellipsis = '…';

// The rules that turn a hub event into a toast ("Toasts" in planning/frontend/spec.md), in one place and
// with no template. HubClient calls one method per event; what each event means is decided here.
//   - A message shows a toast unless its conversation is the open one, which the user can already see.
//   - A comment and a like on the user's post each show a toast that opens the post.
//   - A friend coming online shows a toast, at most one per friend in 5 minutes.
// ToastStore keeps the toasts' own limits (5 seconds on screen, three at most). Counts on pages do not
// change here: they follow on the next load.
@Injectable({ providedIn: 'root' })
export class LiveToastStore {
  private readonly toastStore = inject(ToastStore);
  private readonly conversationsStore = inject(ConversationsStore);
  private readonly presenceStore = inject(PresenceStore);
  private readonly router = inject(Router);
  private readonly text = inject(LanguageStore).text;
  private readonly labels = computed(() => this.text().shared.toasts.live);

  // When each friend's last online toast was shown (milliseconds, as Date.now()), by the friend's id.
  private readonly onlineToastAt = new Map<number, number>();

  // ReceiveMessage. A message from an account that is gone has no conversation to open, so it shows nothing.
  messageReceived(pushed: PushMessageDto): void {
    const { id, username } = pushed.sender;
    const canOpen = id !== null;

    if (canOpen && !this.isOpen(id, username)) {
      const preview = previewOf(
        pushed.content,
        pushed.images.length > 0,
        this.text().messages.list.photo,
      );

      this.toastStore.show(preview, {
        link: this.addressOf(appAddresses.conversation(username)),
        look: ToastLook.Message,
        person: { id, username },
      });
    }
  }

  // ReceiveComment: someone commented on the user's post. A comment from an account that is gone has no
  // picture to show, like a message from one, so it shows nothing.
  commentReceived(comment: NotifyCommentDto): void {
    const { authorId, authorUsername } = comment;
    const hasAuthor = authorId !== null;

    if (hasAuthor) {
      this.toastStore.show(this.labels().comment, {
        link: this.addressOf(appAddresses.post(comment.postId)),
        look: ToastLook.Comment,
        person: { id: authorId, username: authorUsername },
      });
    }
  }

  // PostLiked: someone liked the user's post. A like from an account that is gone has no picture to show,
  // like a message from one, so it shows nothing.
  postLiked(like: PostLikedDto): void {
    const { id, username } = like.likedBy;
    const hasLiker = id !== null;

    if (hasLiker) {
      this.toastStore.show(this.labels().like, {
        link: this.addressOf(appAddresses.post(like.postId)),
        look: ToastLook.Like,
        person: { id, username },
      });
    }
  }

  // UserOnline, once PresenceStore holds the friend's name (it looks an unknown friend up by id). A friend
  // it has no name for, because the lookup failed or the user signed out meanwhile, shows nothing.
  friendOnline(userId: number): void {
    const friend = this.presenceStore.friends().find(({ id }) => id === userId);
    const now = Date.now();
    const lastToastAt = this.onlineToastAt.get(userId);
    const isQuiet = lastToastAt !== undefined && now - lastToastAt < onlineToastQuietMilliseconds;

    const isKnown = friend !== undefined;

    if (isKnown && !isQuiet) {
      this.onlineToastAt.set(userId, now);
      this.toastStore.show(this.labels().online, {
        link: this.addressOf(appAddresses.conversation(friend.username)),
        look: ToastLook.Online,
        person: { id: friend.id, username: friend.username },
      });
    }
  }

  // On sign-out: forgets when each friend's online toast was shown, and takes down every toast still on
  // screen, which could show a message's text over the next screen on a shared machine.
  clear(): void {
    this.onlineToastAt.clear();
    this.toastStore.clear();
  }

  // The open conversation is the one the user sees, also while its friend is still being looked up: then
  // only the address's username is known, and the address is not case sensitive.
  private isOpen(senderId: number | null, senderUsername: string): boolean {
    const open = this.conversationsStore.openConversation();
    const isSameFriend = open?.friend?.id === senderId;
    const isSameAddress = open?.username.toLowerCase() === senderUsername.toLowerCase();

    return open !== null && (isSameFriend || isSameAddress);
  }

  private addressOf(commands: readonly (string | number)[]): string {
    return this.router.createUrlTree(commands).toString();
  }
}

// The start of a message on one line, or the photo label for a message that has only photos.
function previewOf(content: string, hasPhotos: boolean, photoLabel: string): string {
  const oneLine = content.replace(/\s+/g, ' ').trim();
  const characters = [...oneLine];
  const isLong = characters.length > messagePreviewLength;
  const start = isLong ? characters.slice(0, messagePreviewLength).join('') + ellipsis : oneLine;
  const isOnlyPhotos = oneLine === '' && hasPhotos;

  return isOnlyPhotos ? photoLabel : start;
}
