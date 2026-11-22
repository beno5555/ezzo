import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { ToastStore } from '../../shared/toasts/toast-store';
import { ModerationApi } from './moderation-api';
import { ModeratedKind } from './moderated-kind';
import { ModerationStatus } from './moderation-status';

// What an administrator does to a post or a comment from its "…" menu: hide it, or make it visible again.
// The result shows at once ("Quick actions show their result at once" in the spec): the item takes its new
// state before the server has answered, and on a refusal goes back with a toast giving the reason. An item
// takes one request at a time: a click made while one is on its way is sent once that one is answered (only
// the latest wish is kept), so the answers never cross and an undo is not lost.
// An administrator still receives hidden content, so a hidden item stays on the page with its badge and
// the menu's Make visible. The page's copy of the item keeps the flag it was loaded with, so every card
// and comment asks isHidden, which gives the state set here and otherwise the item's own flag.
// The state outlives the page's copy of the item only until the next navigation: that drops every state
// whose request is answered, because the page the user goes to loads the flag the server holds now, which
// another administrator or a report's decision may have changed since. An item moderated elsewhere is
// therefore always right on arrival.
@Injectable({ providedIn: 'root' })
export class ModerationStore {
  private readonly moderationApi = inject(ModerationApi);
  private readonly toastStore = inject(ToastStore);

  // The state set here, by item (a post and a comment can share an id).
  private readonly hiddenStates = signal<ReadonlyMap<string, boolean>>(new Map());
  private readonly busyKeys = new Set<string>();
  // The latest state asked for, by item, not yet sent.
  private readonly wishes = new Map<string, boolean>();

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.dropAnsweredStates());
  }

  // loadedFlag is the flag the item came with from the server.
  isHidden(kind: ModeratedKind, id: number, loadedFlag: boolean): boolean {
    return this.hiddenStates().get(keyOf(kind, id)) ?? loadedFlag;
  }

  async setHidden(kind: ModeratedKind, id: number, isHidden: boolean): Promise<void> {
    const key = keyOf(kind, id);
    const isIdle = !this.busyKeys.has(key);
    const before = this.hiddenStates().get(key);

    this.setState(key, isHidden);
    this.wishes.set(key, isHidden);

    if (isIdle) {
      await this.send(kind, id, key, before);
    }
  }

  // Sends the wishes of one item one after the other. settled is the state the server holds as far as this
  // store knows (undefined: the item's own flag), which a refusal puts back.
  private async send(
    kind: ModeratedKind,
    id: number,
    key: string,
    before: boolean | undefined,
  ): Promise<void> {
    const isPost = kind === ModeratedKind.Post;
    let settled = before;
    let wish = this.wishes.get(key);

    this.busyKeys.add(key);

    while (wish !== undefined) {
      this.wishes.delete(key);
      const status = wish ? ModerationStatus.Hidden : ModerationStatus.Visible;
      const result = isPost
        ? await this.moderationApi.setPostStatus(id, status)
        : await this.moderationApi.setCommentStatus(id, status);
      const newerWish = this.wishes.get(key);
      const isRefused = !result.succeeded;

      if (isRefused) {
        this.toastStore.show(result.message);
        if (newerWish === undefined) {
          this.setState(key, settled);
        }
      } else {
        settled = wish;
      }

      wish = newerWish;
    }

    this.busyKeys.delete(key);
  }

  private dropAnsweredStates(): void {
    this.hiddenStates.update((states) => {
      const next = new Map(states);
      for (const key of states.keys()) {
        if (!this.busyKeys.has(key)) {
          next.delete(key);
        }
      }
      return next;
    });
  }

  // undefined puts the item back to the flag it came with.
  private setState(key: string, isHidden: boolean | undefined): void {
    const isCleared = isHidden === undefined;

    this.hiddenStates.update((states) => {
      const next = new Map(states);
      if (isCleared) {
        next.delete(key);
      } else {
        next.set(key, isHidden);
      }
      return next;
    });
  }
}

function keyOf(kind: ModeratedKind, id: number): string {
  return `${kind}-${id}`;
}
