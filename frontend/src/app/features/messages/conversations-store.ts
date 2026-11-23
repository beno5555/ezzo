import { HttpStatusCode } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { LIMITS } from '../../core/limits';
import { PageLoadStatus } from '../../core/paging/page-load-status';
import { SessionStore } from '../../core/session/session-store';
import { ConfirmationOpener } from '../../shared/confirmation/confirmation-opener';
import { DeleteFade } from '../../shared/fade-out/delete-fade';
import { PreviewAddressMaker } from '../../shared/photos/preview-address-maker';
import { ToastStore } from '../../shared/toasts/toast-store';
import { AcceptedFriendshipDto } from '../friendships/accepted-friendship-dto';
import { DisplayFriendDto } from '../friendships/display-friend-dto';
import { FriendshipApi } from '../friendships/friendship-api';
import { PresenceStore } from '../friendships/presence-store';
import { UserApi } from '../users/user-api';
import { MinimalUserDto } from '../users/minimal-user-dto';
import { ConversationListStore } from './conversation-list-store';
import { ConversationOpenStatus } from './conversation-open-status';
import { MessageApi } from './message-api';
import { MessageDeletedDto } from './message-deleted-dto';
import { MessageEditedDto } from './message-edited-dto';
import { EditDraft } from './edit-draft';
import { MessageSeenDto } from './message-seen-dto';
import { NewMessage } from './new-message';
import { OpenConversation } from './open-conversation';
import { PushMessageDto } from './push-message-dto';
import { SentMessageDto } from './sent-message-dto';
import { StandardMessageDto } from './standard-message-dto';
import { TypingStore } from './typing-store';
import { UnreadStore } from './unread-store';

// How many messages one page of the history holds.
export const messageHistoryPageSize = 30;

// A message the server refused, kept for the box of the conversation it was written in.
type RefusedMessage = { friendId: number; message: NewMessage };

// The chat's shared state: the open conversation, and the conversation list (ConversationListStore) that
// it keeps right. It is a store because the hub changes both: HubClient hands it ReceiveMessage (receive),
// MessageSeen (markSeen), MessageEdited (markEdited) and MessageDeleted (markDeleted). The friends'
// presence comes from PresenceStore, so the open conversation follows UserOnline and UserOffline without a
// reload.
//
// The pages address a conversation by username, while the message endpoints take the id, so open() finds
// the friend first: in the loaded list, or else through the read by username and the friendship check.
// Reading the first page of the history marks the conversation read on the backend; the store then clears
// the row's count and has UnreadStore read its number again.
//
// What the user writes shows at once ("What a user writes shows at once too" in the spec; NewPostStore is
// the pattern): send() puts the message at the end of its conversation, with its photos from the browser's
// previews, until the server's copy takes its place. The pending message is kept apart from the history,
// so it shows again if the user leaves the conversation and comes back before the answer. A refusal
// removes it, shows a toast and keeps the text and photos for that conversation's box (takeReturned).
//
// The list stays right without a reload: a message sent or received moves its conversation to the top
// with the new last message. One that arrives for the open conversation is marked read at once; one for
// a closed conversation raises its row's count, and UnreadStore reads its number again.
//
// Editing and deleting follow the same pattern as comments (CommentThreadStore):
//   - edit: the new text shows at once, marked edited and with the clock, until the server's copy takes its
//     place. Edit itself happens in the message box (startEditing puts the message's text into it, and
//     editDraft tells the box). A refusal puts the old text back, shows a toast and gives the box what the
//     user wrote again. The friend's edit arrives as MessageEdited (markEdited).
//   - delete: asks first; the message fades out (DeleteFade), then leaves the user's view. A refusal brings
//     it back with a toast. The friend's deletion arrives as MessageDeleted (markDeleted), and the message
//     leaves their open conversation at once.
// The list row's last message follows all of these, as long as the message is one the open conversation
// holds; for one it does not hold, the list is read again.
@Injectable({ providedIn: 'root' })
export class ConversationsStore {
  private readonly messageApi = inject(MessageApi);
  private readonly userApi = inject(UserApi);
  private readonly friendshipApi = inject(FriendshipApi);
  private readonly conversationListStore = inject(ConversationListStore);
  private readonly presenceStore = inject(PresenceStore);
  private readonly unreadStore = inject(UnreadStore);
  private readonly sessionStore = inject(SessionStore);
  private readonly toastStore = inject(ToastStore);
  private readonly previewAddressMaker = inject(PreviewAddressMaker);
  private readonly confirmationOpener = inject(ConfirmationOpener);
  private readonly typingStore = inject(TypingStore);
  private readonly text = inject(LanguageStore).text;

  // The user's messages on their way to the server, oldest first, for every conversation.
  private readonly sending = signal<readonly StandardMessageDto[]>([]);
  // The ids of the user's messages whose edit is on its way.
  private readonly savingEditIds = signal<ReadonlySet<number>>(new Set());
  private readonly currentEditDraft = signal<EditDraft | null>(null);
  // The edit the user is writing in the message box, or null (see startEditing).
  readonly editDraft = this.currentEditDraft.asReadonly();
  private readonly deleteFade = new DeleteFade();
  // Oldest first, until the box of their conversation takes them back.
  private readonly refused = signal<readonly RefusedMessage[]>([]);
  // When each friend last read the user's messages (MessageSeen), for a server copy that arrives later.
  private readonly seenAtByFriend = new Map<number, string>();
  // Pending messages count down from -1, so their ids never meet a server's id.
  private lastPendingId = 0;
  // Counts clear() calls, so that a send answered after a sign-out changes nothing.
  private clearNumber = 0;

  private readonly opened = signal<OpenConversation | null>(null);
  private nextHistoryPageNumber: number = LIMITS.paging.firstPageNumber;
  // Numbers each opening, so that answers meant for a conversation the user has left are ignored.
  private openingNumber = 0;

  // Null while no conversation is open. The messages on their way come after the history.
  readonly openConversation = computed(() => {
    const conversation = this.opened();
    const friend = conversation?.friend ?? null;
    let shown = conversation;

    if (conversation !== null && friend !== null) {
      const pending = this.sending().filter((message) => message.receiverId === friend.id);
      const goneIds = this.deleteFade.goneIds();
      const kept = conversation.messages.filter((message) => !goneIds.has(message.id));
      shown = {
        ...conversation,
        friend: this.presenceStore.withPresence(friend),
        messages: [...kept, ...pending],
        sendingIds: new Set([...pending.map((message) => message.id), ...this.savingEditIds()]),
        waitingIds: this.deleteFade.waitingIds(),
        fadingIds: this.deleteFade.fadingIds(),
      };
    }

    return shown;
  });

  // The oldest refused message of the open conversation, for its box to fill itself with, or null.
  readonly returnedMessage = computed(() => {
    const friendId = this.opened()?.friend?.id ?? null;
    const returned = this.refused().find((refusal) => refusal.friendId === friendId);

    return returned?.message ?? null;
  });

  // Opens the conversation at /messages/:username, and again from a Try again button after a failure.
  async open(username: string): Promise<void> {
    this.openingNumber++;
    const opening = this.openingNumber;
    this.currentEditDraft.set(null);
    this.conversationListStore.forgetRead();
    this.nextHistoryPageNumber = LIMITS.paging.firstPageNumber;
    const listedFriend = this.conversationListStore.friendOf(username);

    if (listedFriend !== null) {
      this.opened.set(conversationWith(username, listedFriend));
      await this.loadHistoryPage(opening, listedFriend.id);
    } else {
      this.opened.set(conversationLoading(username));
      await this.findFriend(opening, username);
    }
  }

  // From the top of the history, and from its Try again button: the next older page, or the one that failed.
  async loadOlderMessages(): Promise<void> {
    const conversation = this.opened();
    const friend = conversation?.friend ?? null;
    const canLoad =
      friend !== null &&
      (conversation?.historyStatus === PageLoadStatus.Idle ||
        conversation?.historyStatus === PageLoadStatus.Failed);

    if (canLoad) {
      await this.loadHistoryPage(this.openingNumber, friend.id);
    }
  }

  // When the conversation leaves the screen. An answer still on its way is ignored when it arrives.
  close(): void {
    this.openingNumber++;
    this.currentEditDraft.set(null);
    this.conversationListStore.forgetRead();
    this.opened.set(null);
  }

  // Sends a message to the friend of the open conversation; it shows at once (see the class comment).
  async send(newMessage: NewMessage): Promise<void> {
    const friend = this.opened()?.friend ?? null;
    const userId = this.sessionStore.userId();
    const canSend = friend !== null && userId !== null;

    if (canSend) {
      const clearNumber = this.clearNumber;
      const previewAddresses = newMessage.photos.map((photo) =>
        this.previewAddressMaker.create(photo),
      );
      const pending = this.createPendingMessage(newMessage, friend.id, previewAddresses);

      this.sending.update((messages) => [...messages, pending]);
      const result = await this.messageApi.send(friend.id, newMessage);
      this.sending.update((messages) => messages.filter((message) => message.id !== pending.id));
      const isSameSession = clearNumber === this.clearNumber;

      if (isSameSession) {
        this.settleSent(friend, userId, newMessage, result);
      }
      // The pending message has left the conversation, so no <img> shows these addresses any more.
      for (const address of previewAddresses) {
        this.previewAddressMaker.release(address);
      }
    }
  }

  // Takes the open conversation's oldest refused message out, for its box.
  takeReturned(): NewMessage | null {
    const returned = this.returnedMessage();

    this.refused.update((refusals) => refusals.filter((refusal) => refusal.message !== returned));

    return returned;
  }

  // The user's own message with new text. message is the message as the server holds it, which comes back
  // if the server refuses the edit.
  async edit(message: StandardMessageDto, content: string): Promise<void> {
    const isIdle = !this.savingEditIds().has(message.id) && !this.deleteFade.isBusy(message.id);

    if (isIdle) {
      const clearNumber = this.clearNumber;
      this.currentEditDraft.set(null);
      this.markSavingEdit(message.id, true);
      this.changeOpenedMessage(message.id, () => ({ ...message, content, isEdited: true }));
      const result = await this.messageApi.edit(message.id, content);
      this.markSavingEdit(message.id, false);
      const isSameSession = clearNumber === this.clearNumber;

      if (isSameSession) {
        if (result.succeeded) {
          this.changeOpenedMessage(message.id, () => result.data);
        } else {
          this.changeOpenedMessage(message.id, () => message);
          // The message box takes what the user wrote back, unless they have started another edit since.
          if (this.currentEditDraft() === null) {
            this.currentEditDraft.set({ message, content });
          }
          this.toastStore.show(result.message);
        }
      }
    }
  }

  // The user chose Edit on their own message: the message box takes its text. Only one edit is open at a
  // time, so this replaces any other.
  startEditing(message: StandardMessageDto): void {
    this.currentEditDraft.set({ message, content: message.content });
  }

  // Cancel, or the box's conversation leaves the screen.
  stopEditing(): void {
    this.currentEditDraft.set(null);
  }

  // Asks first. Once the user confirms, the message says "Deleting…" until the server answers. On a yes it
  // fades out and leaves their view; a refusal leaves it as it was, with a toast.
  async deleteMessage(message: StandardMessageDto): Promise<void> {
    const isIdle = !this.savingEditIds().has(message.id) && !this.deleteFade.isBusy(message.id);

    if (isIdle) {
      const labels = this.text().messages.deleteConfirmation;
      const isConfirmed = await this.confirmationOpener.ask({
        question: labels.question,
        detail: labels.detail,
        confirmButton: labels.confirmButton,
        isDestructive: true,
      });

      if (isConfirmed) {
        const clearNumber = this.clearNumber;
        const result = await this.deleteFade.delete(message.id, () =>
          this.messageApi.delete(message.id),
        );
        const isSameSession = clearNumber === this.clearNumber;

        if (isSameSession) {
          this.settleDeleted(message, result);
        }
      }
    }
  }

  // ReceiveMessage: a friend's message, the moment it was stored.
  async receive(pushed: PushMessageDto): Promise<void> {
    const senderId = pushed.sender.id;
    const userId = this.sessionStore.userId();

    if (senderId !== null && userId !== null) {
      // The friend has sent their message, so they are no longer writing it.
      this.typingStore.stop(senderId);
      const arrived: StandardMessageDto = {
        ...pushed,
        receiverId: userId,
        seen: false,
        seenAt: null,
        isEdited: false,
      };
      // A conversation the list does not hold yet gets a row; the friend wrote just now, so is online.
      const friend: DisplayFriendDto = {
        id: senderId,
        username: pushed.sender.username,
        lastActiveAt: null,
        isActive: true,
      };
      const isOpen = this.opened()?.friend?.id === senderId;

      if (isOpen) {
        this.addToOpened(senderId, arrived);
        this.conversationListStore.putOnTop(friend, arrived, senderId, () => 0);
        await this.messageApi.markAsRead(senderId);
      } else {
        this.conversationListStore.putOnTop(friend, arrived, senderId, (count) => count + 1);
      }
      await this.unreadStore.refresh();
    }
  }

  // MessageEdited: the friend changed a message. The open conversation shows the new text and says it was
  // edited, and its row follows when it is the last message. A message the open conversation does not hold
  // may be the last one of a closed conversation, which the list does not say (a row carries no message
  // id), so the list is read again, quietly.
  async markEdited({ id, content }: MessageEditedDto): Promise<void> {
    if (this.holdsMessage(id)) {
      this.changeOpenedMessage(id, (message) => ({ ...message, content, isEdited: true }));
    } else {
      await this.refreshListIfLoaded();
    }
  }

  // MessageDeleted: the friend deleted a message. It leaves the open conversation at once (no fade: the
  // user did not ask for it), and the row follows. A message the open conversation does not hold may be
  // the last one of a closed conversation, or an unread one, so the list and the unread count are read
  // again, quietly.
  async markDeleted({ id }: MessageDeletedDto): Promise<void> {
    if (this.holdsMessage(id)) {
      this.removeFromOpened(id);
    } else {
      // The header's unread count follows even when the list was never loaded.
      await Promise.all([this.refreshListIfLoaded(), this.unreadStore.refresh()]);
    }
  }

  // MessageSeen: the friend has read the user's messages, up to seenAt. One sent later stays unseen.
  markSeen({ seenBy, seenAt }: MessageSeenDto): void {
    this.seenAtByFriend.set(seenBy, seenAt);
    this.opened.update((conversation) => {
      const isTheirs = conversation?.friend?.id === seenBy;

      return conversation && isTheirs
        ? {
            ...conversation,
            messages: conversation.messages.map((message) => {
              const isNewlySeen =
                message.receiverId === seenBy && !message.seen && isReadAt(message, seenAt);

              return isNewlySeen ? { ...message, seen: true, seenAt } : message;
            }),
          }
        : conversation;
    });
  }

  // On sign-out.
  clear(): void {
    this.close();
    this.clearNumber++;
    this.sending.set([]);
    this.savingEditIds.set(new Set());
    this.currentEditDraft.set(null);
    this.refused.set([]);
    this.seenAtByFriend.clear();
    this.conversationListStore.clear();
  }

  private async findFriend(opening: number, username: string): Promise<void> {
    const userResult = await this.userApi.getByUsername(username);

    if (this.isCurrent(opening)) {
      if (userResult.succeeded) {
        const askedAt = Date.now();
        const friendshipResult = await this.friendshipApi.getAcceptedFriendship(userResult.data.id);
        await this.takeFriendship(opening, username, friendshipResult, askedAt);
      } else {
        this.settleFailedLookup(opening, userResult, ConversationOpenStatus.NotFound);
      }
    }
  }

  private async takeFriendship(
    opening: number,
    username: string,
    result: AppResult<AcceptedFriendshipDto>,
    askedAt: number,
  ): Promise<void> {
    if (this.isCurrent(opening)) {
      if (result.succeeded) {
        const friend = result.data.otherUser;
        this.presenceStore.track([friend], askedAt);
        this.opened.set(conversationWith(username, friend));
        await this.loadHistoryPage(opening, friend.id);
      } else {
        this.settleFailedLookup(opening, result, ConversationOpenStatus.NotFriend);
      }
    }
  }

  // A 404 means the user or the friendship is not there; any other failure may pass, so it can be tried again.
  private settleFailedLookup(
    opening: number,
    result: { message: string; status: number },
    notFoundMeaning: ConversationOpenStatus,
  ): void {
    const isNotFound = result.status === HttpStatusCode.NotFound;
    this.updateOpened(opening, {
      status: isNotFound ? notFoundMeaning : ConversationOpenStatus.Failed,
      failureMessage: isNotFound ? null : result.message,
    });
  }

  private async loadHistoryPage(opening: number, friendId: number): Promise<void> {
    const pageNumber = this.nextHistoryPageNumber;
    this.updateOpened(opening, { historyStatus: PageLoadStatus.Loading });

    const result = await this.messageApi.getConversation(friendId, {
      pageNumber,
      pageSize: messageHistoryPageSize,
    });

    if (this.isCurrent(opening)) {
      if (result.succeeded) {
        this.nextHistoryPageNumber = pageNumber + 1;
        const isLastPage = result.data.length < messageHistoryPageSize;
        this.opened.update(
          (conversation) =>
            conversation && {
              ...conversation,
              messages: withOlderMessages(conversation.messages, result.data),
              historyStatus: isLastPage ? PageLoadStatus.Ended : PageLoadStatus.Idle,
              historyFailure: null,
            },
        );
        const isFirstPage = pageNumber === LIMITS.paging.firstPageNumber;
        if (isFirstPage) {
          await this.markRead(friendId);
        }
      } else {
        this.updateOpened(opening, {
          historyStatus: PageLoadStatus.Failed,
          historyFailure: result.message,
        });
      }
    }
  }

  // The backend marked the conversation read when its history was read.
  private async markRead(friendId: number): Promise<void> {
    this.conversationListStore.markRead(friendId);
    await this.unreadStore.refresh();
  }

  private settleSent(
    friend: DisplayFriendDto,
    userId: number,
    newMessage: NewMessage,
    result: AppResult<SentMessageDto>,
  ): void {
    if (result.succeeded) {
      const copy = this.toOwnCopy(result.data, friend.id);
      this.addToOpened(friend.id, copy);
      this.conversationListStore.putOnTop(friend, copy, userId, (count) => count);
    } else {
      this.refused.update((refusals) => [
        ...refusals,
        { friendId: friend.id, message: newMessage },
      ]);
      this.toastStore.show(result.message);
    }
  }

  private markSavingEdit(messageId: number, isSaving: boolean): void {
    this.savingEditIds.update((ids) => {
      const next = new Set(ids);
      if (isSaving) {
        next.add(messageId);
      } else {
        next.delete(messageId);
      }

      return next;
    });
  }

  // Changes one message of the open conversation, and the row's last message with it when that was it.
  private changeOpenedMessage(
    messageId: number,
    change: (message: StandardMessageDto) => StandardMessageDto,
  ): void {
    this.opened.update(
      (conversation) =>
        conversation && {
          ...conversation,
          messages: conversation.messages.map((message) =>
            message.id === messageId ? change(message) : message,
          ),
        },
    );
    this.showLastMessageInRow();
  }

  // The open conversation's row says what the conversation's last message is now. A conversation with no
  // message to show leaves its row as it is.
  private showLastMessageInRow(): void {
    const friendId = this.opened()?.friend?.id ?? null;
    const last = this.visibleOpenedMessages().at(-1);

    if (friendId !== null && last !== undefined) {
      this.conversationListStore.showLastMessage(friendId, last);
    }
  }

  // The messages of the open conversation that have not faded out and left.
  private visibleOpenedMessages(): readonly StandardMessageDto[] {
    const goneIds = this.deleteFade.goneIds();

    return (this.opened()?.messages ?? []).filter((message) => !goneIds.has(message.id));
  }

  private settleDeleted(message: StandardMessageDto, result: AppResult<void>): void {
    if (result.succeeded) {
      this.removeFromOpened(message.id);
      this.toastStore.show(this.text().messages.deletedToast);
    } else {
      this.toastStore.show(result.message);
    }
  }

  // The message leaves the open conversation for good, and its row says what the last message is now: the
  // row of a conversation with no message left goes, when the whole history has been read.
  private removeFromOpened(messageId: number): void {
    const friendId = this.opened()?.friend?.id ?? null;
    this.opened.update(
      (conversation) =>
        conversation && {
          ...conversation,
          messages: conversation.messages.filter((shown) => shown.id !== messageId),
        },
    );
    const isConversationEmpty =
      this.opened()?.historyStatus === PageLoadStatus.Ended &&
      this.visibleOpenedMessages().length === 0;

    if (isConversationEmpty && friendId !== null) {
      this.conversationListStore.remove(friendId);
    } else {
      this.showLastMessageInRow();
    }
  }

  // Into the open conversation, if it is with that friend, in the order of the server's times.
  private addToOpened(friendId: number, added: StandardMessageDto): void {
    this.opened.update((conversation) => {
      const isWithFriend = conversation?.friend?.id === friendId;

      return conversation && isWithFriend
        ? { ...conversation, messages: withMessage(conversation.messages, added) }
        : conversation;
    });
  }

  // As the history will show it once it is stored. The time is the browser's until the server's copy.
  private createPendingMessage(
    newMessage: NewMessage,
    friendId: number,
    previewAddresses: string[],
  ): StandardMessageDto {
    this.lastPendingId -= 1;

    return {
      id: this.lastPendingId,
      content: newMessage.content,
      // Negative, as the message's id is: a preview has no id on the server.
      images: previewAddresses.map((address, index) => ({
        id: -(index + 1),
        address,
        orderIndex: index,
      })),
      sender: this.ownSender(),
      receiverId: friendId,
      sentAt: new Date().toISOString(),
      seen: false,
      seenAt: null,
      isEdited: false,
    };
  }

  // A MessageSeen that came before the copy, and after the message was stored, means the friend read it.
  private toOwnCopy(sent: SentMessageDto, friendId: number): StandardMessageDto {
    const lastSeenAt = this.seenAtByFriend.get(friendId) ?? null;
    const isSeen = lastSeenAt !== null && isReadAt(sent, lastSeenAt);

    return {
      ...sent,
      sender: this.ownSender(),
      receiverId: friendId,
      seen: isSeen,
      seenAt: isSeen ? lastSeenAt : null,
      isEdited: false,
    };
  }

  private ownSender(): MinimalUserDto {
    const user = this.sessionStore.user();

    return { id: user?.id ?? null, username: user?.username ?? '' };
  }

  private async refreshListIfLoaded(): Promise<void> {
    if (this.conversationListStore.hasRows()) {
      await this.conversationListStore.refresh();
    }
  }

  private holdsMessage(messageId: number): boolean {
    return this.opened()?.messages.some((message) => message.id === messageId) ?? false;
  }

  private isCurrent(opening: number): boolean {
    return opening === this.openingNumber;
  }

  private updateOpened(opening: number, change: Partial<OpenConversation>): void {
    if (this.isCurrent(opening)) {
      this.opened.update((conversation) => conversation && { ...conversation, ...change });
    }
  }
}

function conversationLoading(username: string): OpenConversation {
  return {
    username,
    status: ConversationOpenStatus.Loading,
    failureMessage: null,
    friend: null,
    messages: [],
    historyStatus: PageLoadStatus.Idle,
    historyFailure: null,
    // openConversation fills these from the messages on their way, being deleted and fading out.
    sendingIds: new Set(),
    waitingIds: new Set(),
    fadingIds: new Set(),
  };
}

function conversationWith(username: string, friend: DisplayFriendDto): OpenConversation {
  return { ...conversationLoading(username), status: ConversationOpenStatus.Ready, friend };
}

// A message that arrives or was sent goes where its time puts it, usually last, and only once: the history
// may already hold it when its page was read after it was stored.
function withMessage(
  shown: readonly StandardMessageDto[],
  added: StandardMessageDto,
): readonly StandardMessageDto[] {
  const isShown = shown.some((message) => message.id === added.id);
  const laterIndex = shown.findIndex(
    (message) => Date.parse(message.sentAt) > Date.parse(added.sentAt),
  );
  let messages = shown;

  if (!isShown) {
    messages =
      laterIndex < 0
        ? [...shown, added]
        : [...shown.slice(0, laterIndex), added, ...shown.slice(laterIndex)];
  }

  return messages;
}

// An older page goes above what is shown. A message sent meanwhile pushes the pages back by one, so the
// older page can repeat a message that is already shown.
function withOlderMessages(
  shown: readonly StandardMessageDto[],
  olderPage: readonly StandardMessageDto[],
): readonly StandardMessageDto[] {
  const shownIds = new Set(shown.map((message) => message.id));
  const fresh = olderPage.filter((message) => !shownIds.has(message.id));

  return [...fresh, ...shown];
}

// A message counts as read by a friend who read the conversation at seenAt if it was stored by then.
function isReadAt(message: { sentAt: string }, seenAt: string): boolean {
  return Date.parse(message.sentAt) <= Date.parse(seenAt);
}
