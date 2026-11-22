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
import { isUnavailableUsername } from '../users/unavailable-username';
import { UserApi } from '../users/user-api';
import { MinimalUserDto } from '../users/minimal-user-dto';
import { ConversationFriendDto } from './conversation-friend-dto';
import { ConversationOpenStatus } from './conversation-open-status';
import { MessageApi } from './message-api';
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

// How many conversations one page of the list holds, and how many messages one page of the history.
export const conversationListPageSize = 20;
export const messageHistoryPageSize = 30;

// A message the server refused, kept for the box of the conversation it was written in.
type RefusedMessage = { friendId: number; message: NewMessage };

// The chat's shared state: the conversation list and the open conversation. It is a store because the hub
// changes both: HubClient hands it ReceiveMessage (receive) and MessageSeen (markSeen). The friends'
// presence comes from PresenceStore, so a row and the open conversation follow UserOnline and UserOffline
// without a reload.
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
//     it back with a toast. The backend pushes nothing for a deletion, so the friend's open conversation
//     keeps the message until it is loaded again.
// The list row's last message follows both, as long as the message is one the open conversation holds.
@Injectable({ providedIn: 'root' })
export class ConversationsStore {
  private readonly messageApi = inject(MessageApi);
  private readonly userApi = inject(UserApi);
  private readonly friendshipApi = inject(FriendshipApi);
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

  private readonly rows = signal<readonly ConversationFriendDto[]>([]);
  private readonly currentListStatus = signal<PageLoadStatus>(PageLoadStatus.Idle);
  private readonly lastListFailure = signal<string | null>(null);
  private nextListPageNumber: number = LIMITS.paging.firstPageNumber;
  // True from loadConversations until its first page arrives, which then replaces the rows.
  private isListRestarting = false;
  // Numbers each read of the list, so that only the answer to the newest one is kept.
  private listReadNumber = 0;

  private readonly opened = signal<OpenConversation | null>(null);
  private nextHistoryPageNumber: number = LIMITS.paging.firstPageNumber;
  // Numbers each opening, so that answers meant for a conversation the user has left are ignored.
  private openingNumber = 0;
  // The friend whose conversation the current opening marked read. A list page that was read before the
  // mark can arrive after it, and must not bring the old count back.
  private readFriendId: number | null = null;

  private readonly lastActiveById = computed(
    () => new Map(this.presenceStore.friends().map((friend) => [friend.id, friend.lastActiveAt])),
  );

  // The rows, most recent conversation first, each friend with their live presence.
  readonly conversations = computed(() =>
    this.rows().map((row) => ({
      ...row,
      conversationFriend: this.withPresence(row.conversationFriend),
    })),
  );
  readonly listStatus = this.currentListStatus.asReadonly();
  // The text of the last failed page of the list, null once a page arrives.
  readonly listFailure = this.lastListFailure.asReadonly();

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
        friend: this.withPresence(friend),
        messages: [...kept, ...pending],
        sendingIds: new Set([...pending.map((message) => message.id), ...this.savingEditIds()]),
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

  // Reads the list from its first page, replacing the rows once that page arrives.
  async loadConversations(): Promise<void> {
    this.nextListPageNumber = LIMITS.paging.firstPageNumber;
    this.isListRestarting = true;
    await this.loadListPage();
  }

  // From the end of the list, and from its Try again button: the next page, or the one that failed.
  async loadMoreConversations(): Promise<void> {
    const canLoad =
      this.currentListStatus() === PageLoadStatus.Idle ||
      this.currentListStatus() === PageLoadStatus.Failed;

    if (canLoad) {
      await this.loadListPage();
    }
  }

  // Opens the conversation at /messages/:username, and again from a Try again button after a failure.
  async open(username: string): Promise<void> {
    this.openingNumber++;
    const opening = this.openingNumber;
    this.currentEditDraft.set(null);
    this.readFriendId = null;
    this.nextHistoryPageNumber = LIMITS.paging.firstPageNumber;
    const listedFriend = this.listedFriend(username);

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
    this.readFriendId = null;
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

  // Asks first. Once the user confirms, the message fades out and leaves their view before the server has
  // answered; a refusal brings it back.
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
        await this.deleteFade.fadeOut(message.id);
        this.showLastMessageInRow();
        const result = await this.messageApi.delete(message.id);
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
        this.putOnTop(friend, arrived, senderId, () => 0);
        await this.messageApi.markAsRead(senderId);
      } else {
        this.putOnTop(friend, arrived, senderId, (count) => count + 1);
      }
      await this.unreadStore.refresh();
    }
  }

  // MessageEdited: the friend changed a message. The open conversation shows the new text and says it was
  // edited, and its row follows when it is the last message. A message the open conversation does not hold
  // may be the last one of a closed conversation, which the list does not say (a row carries no message
  // id), so the list's rows are read again, quietly.
  async markEdited({ id, content }: MessageEditedDto): Promise<void> {
    const isShown = this.opened()?.messages.some((message) => message.id === id) ?? false;

    if (isShown) {
      this.changeOpenedMessage(id, (message) => ({ ...message, content, isEdited: true }));
    } else if (this.rows().length > 0) {
      await this.refreshListRows();
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
    this.listReadNumber++;
    this.rows.set([]);
    this.currentListStatus.set(PageLoadStatus.Idle);
    this.lastListFailure.set(null);
    this.nextListPageNumber = LIMITS.paging.firstPageNumber;
    this.isListRestarting = false;
  }

  private async loadListPage(): Promise<void> {
    this.listReadNumber++;
    const thisReadNumber = this.listReadNumber;
    const pageNumber = this.nextListPageNumber;
    const askedAt = Date.now();
    this.currentListStatus.set(PageLoadStatus.Loading);

    const result = await this.messageApi.getConversationFriends({
      pageNumber,
      pageSize: conversationListPageSize,
    });

    const isNewestRead = thisReadNumber === this.listReadNumber;
    if (isNewestRead) {
      if (result.succeeded) {
        this.presenceStore.track(
          result.data.map((row) => row.conversationFriend),
          askedAt,
        );
        const page = result.data.map((row) => this.withReadCountCleared(row));
        const shownRows = this.isListRestarting ? [] : this.rows();
        this.rows.set(withNewRows(shownRows, page));
        this.isListRestarting = false;
        this.nextListPageNumber = pageNumber + 1;
        this.lastListFailure.set(null);
        const isLastPage = result.data.length < conversationListPageSize;
        this.currentListStatus.set(isLastPage ? PageLoadStatus.Ended : PageLoadStatus.Idle);
      } else {
        this.lastListFailure.set(result.message);
        this.currentListStatus.set(PageLoadStatus.Failed);
      }
    }
  }

  // A friend the list holds under that username. A placeholder name (an unavailable account) can stand for
  // several rows, so it never matches.
  private listedFriend(username: string): DisplayFriendDto | null {
    const isAddressable = !isUnavailableUsername(username);
    const row = this.rows().find((shown) => shown.conversationFriend.username === username);

    return isAddressable && row !== undefined ? row.conversationFriend : null;
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
    this.readFriendId = friendId;
    this.rows.update((rows) => rows.map((row) => this.withReadCountCleared(row)));
    await this.unreadStore.refresh();
  }

  private withReadCountCleared(row: ConversationFriendDto): ConversationFriendDto {
    const isRead = row.conversationFriend.id === this.readFriendId;

    return isRead ? { ...row, unreadCount: 0 } : row;
  }

  private withPresence(friend: DisplayFriendDto): DisplayFriendDto {
    const lastActiveById = this.lastActiveById();
    const lastActiveAt = lastActiveById.has(friend.id)
      ? (lastActiveById.get(friend.id) ?? null)
      : friend.lastActiveAt;

    return { ...friend, lastActiveAt, isActive: lastActiveAt === null };
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
      this.putOnTop(friend, copy, userId, (count) => count);
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
      this.rows.update((rows) =>
        rows.map((row) =>
          row.conversationFriend.id === friendId
            ? {
                ...row,
                lastMessageContent: last.content,
                lastMessageSentAt: last.sentAt,
                lastMessageSenderId: last.sender.id ?? row.lastMessageSenderId,
                lastMessageImageCount: last.images.length,
              }
            : row,
        ),
      );
    }
  }

  // The messages of the open conversation that have not faded out and left.
  private visibleOpenedMessages(): readonly StandardMessageDto[] {
    const goneIds = this.deleteFade.goneIds();

    return (this.opened()?.messages ?? []).filter((message) => !goneIds.has(message.id));
  }

  private settleDeleted(message: StandardMessageDto, result: AppResult<void>): void {
    if (result.succeeded) {
      const friendId = this.opened()?.friend?.id ?? null;
      this.opened.update(
        (conversation) =>
          conversation && {
            ...conversation,
            messages: conversation.messages.filter((shown) => shown.id !== message.id),
          },
      );
      const isConversationEmpty =
        this.opened()?.historyStatus === PageLoadStatus.Ended &&
        this.visibleOpenedMessages().length === 0;

      if (isConversationEmpty) {
        // The backend lists only conversations that hold a message.
        this.rows.update((rows) => rows.filter((row) => row.conversationFriend.id !== friendId));
      } else {
        this.showLastMessageInRow();
      }
      this.toastStore.show(this.text().messages.deletedToast);
    } else {
      this.deleteFade.bringBack(message.id);
      this.showLastMessageInRow();
      this.toastStore.show(result.message);
    }
  }

  // Reads the first page of the list again and replaces the rows it holds, leaving the others and the
  // list's paging alone, so that the list does not flicker or lose its place.
  private async refreshListRows(): Promise<void> {
    const readNumber = this.listReadNumber;
    const result = await this.messageApi.getConversationFriends({
      pageNumber: LIMITS.paging.firstPageNumber,
      pageSize: conversationListPageSize,
    });
    const isNewestRead = readNumber === this.listReadNumber;

    if (result.succeeded && isNewestRead) {
      const fresh = new Map(result.data.map((row) => [row.conversationFriend.id, row]));
      this.rows.update((rows) =>
        rows.map((row) => this.withReadCountCleared(fresh.get(row.conversationFriend.id) ?? row)),
      );
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

  // The friend's row goes first, with the message as its last; a friend without a row gets one.
  private putOnTop(
    friend: DisplayFriendDto,
    last: StandardMessageDto,
    senderId: number,
    unreadCountOf: (count: number) => number,
  ): void {
    this.rows.update((rows) => {
      const shown = rows.find((row) => row.conversationFriend.id === friend.id);
      const moved: ConversationFriendDto = {
        conversationFriend: shown?.conversationFriend ?? friend,
        lastMessageContent: last.content,
        lastMessageSentAt: last.sentAt,
        lastMessageSenderId: senderId,
        lastMessageImageCount: last.images.length,
        unreadCount: unreadCountOf(shown?.unreadCount ?? 0),
      };

      return [moved, ...rows.filter((row) => row !== shown)];
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
    // openConversation fills both from the messages on their way and the ones fading out.
    sendingIds: new Set(),
    fadingIds: new Set(),
  };
}

function conversationWith(username: string, friend: DisplayFriendDto): OpenConversation {
  return { ...conversationLoading(username), status: ConversationOpenStatus.Ready, friend };
}

// A later page of the list can repeat a row when a conversation moved up between two reads.
function withNewRows(
  rows: readonly ConversationFriendDto[],
  page: readonly ConversationFriendDto[],
): readonly ConversationFriendDto[] {
  const shownIds = new Set(rows.map((row) => row.conversationFriend.id));
  const fresh = page.filter((row) => !shownIds.has(row.conversationFriend.id));

  return [...rows, ...fresh];
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
