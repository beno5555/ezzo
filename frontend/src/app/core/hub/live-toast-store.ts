import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
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

// The rules that turn a hub event into a toast ("Toasts" in .scratch/frontend/spec.md), in one place and
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
    const { sender } = pushed;
    const canOpen = sender.id !== null;

    if (canOpen && !this.isOpen(sender.id, sender.username)) {
      const labels = this.labels();
      const preview = previewOf(
        pushed.content,
        pushed.images.length > 0,
        this.text().messages.list.photo,
      );

      this.toastStore.show(
        labels.message(sender.username, preview),
        this.addressOf(appAddresses.conversation(sender.username)),
      );
    }
  }

  // ReceiveComment: someone commented on the user's post.
  commentReceived(comment: NotifyCommentDto): void {
    this.toastStore.show(
      this.labels().comment(comment.authorUsername),
      this.addressOf(appAddresses.post(comment.postId)),
    );
  }

  // PostLiked: someone liked the user's post.
  postLiked(like: PostLikedDto): void {
    this.toastStore.show(
      this.labels().like(like.likedBy.username),
      this.addressOf(appAddresses.post(like.postId)),
    );
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
      this.toastStore.show(
        this.labels().online(friend.username),
        this.addressOf(appAddresses.conversation(friend.username)),
      );
    }
  }

  // On sign-out.
  clear(): void {
    this.onlineToastAt.clear();
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
