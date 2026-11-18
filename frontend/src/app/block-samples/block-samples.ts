import { Component, computed, inject } from '@angular/core';
import { LanguageStore } from '../core/languages/language-store';
import { appAddresses } from '../core/routing/app-addresses';
import { AvatarSize } from '../shared/avatar/avatar-size';
import { Avatar } from '../shared/avatar/avatar';
import { Button } from '../shared/button/button';
import { ConfirmationOpener } from '../shared/confirmation/confirmation-opener';
import { DialogOpener } from '../shared/dialog/dialog-opener';
import { Menu } from '../shared/menu/menu';
import { MenuEntry } from '../shared/menu/menu-entry';
import { ToastStore } from '../shared/toasts/toast-store';
import { SampleDialog } from './sample-dialog/sample-dialog';

// Sample users, one per disc colour, with usernames in one part and in two.
const sampleUsers = [
  { id: 1, username: 'john_doe' },
  { id: 2, username: 'alice' },
  { id: 3, username: 'mary-jane' },
  { id: 4, username: 'giorgi' },
  { id: 5, username: 'nino_beridze' },
  { id: 6, username: 'x99' },
  { id: 7, username: 'luka-k' },
  { id: 8, username: 'tamar' },
] as const;

// The word the typed confirmation asks for: on the settings page, the user's own username.
const sampleTypedWord = 'alice_smith';
const queuedToastCount = 4;

// One button per shared block (ticket 06), on the bare page, to prove them in the running app.
// Ticket 07's shell removes this folder.
@Component({
  imports: [Avatar, Button, Menu],
  selector: 'app-block-samples',
  templateUrl: './block-samples.html',
  styleUrl: './block-samples.css',
})
export class BlockSamples {
  private readonly toastStore = inject(ToastStore);
  private readonly dialogOpener = inject(DialogOpener);
  private readonly confirmationOpener = inject(ConfirmationOpener);

  protected readonly text = inject(LanguageStore).text;
  protected readonly sampleUsers = sampleUsers;
  protected readonly avatarSize = AvatarSize;
  protected readonly menuEntries = computed<MenuEntry[]>(() => {
    const samples = this.text().blockSamples;

    return [
      {
        label: samples.menuReport,
        isDestructive: false,
        choose: () => this.toastChosen(samples.menuReport),
      },
      {
        label: samples.menuEdit,
        isDestructive: false,
        choose: () => this.toastChosen(samples.menuEdit),
      },
      {
        label: samples.menuDelete,
        isDestructive: true,
        choose: () => this.toastChosen(samples.menuDelete),
      },
    ];
  });

  showToast(): void {
    this.toastStore.show(this.text().blockSamples.toastMessage);
  }

  showLinkToast(): void {
    this.toastStore.show(this.text().blockSamples.linkToastMessage, appAddresses.home);
  }

  showFourToasts(): void {
    for (let number = 1; number <= queuedToastCount; number += 1) {
      this.toastStore.show(this.text().blockSamples.numberedToastMessage(number));
    }
  }

  openDialog(): void {
    this.dialogOpener.open<void, null, SampleDialog>(SampleDialog, null);
  }

  async askConfirmation(): Promise<void> {
    const samples = this.text().blockSamples;
    const isConfirmed = await this.confirmationOpener.ask({
      question: samples.confirmationQuestion,
      detail: samples.confirmationDetail,
      confirmButton: samples.confirmationConfirm,
      isDestructive: true,
    });

    this.toastAnswer(isConfirmed);
  }

  async askTypedConfirmation(): Promise<void> {
    const samples = this.text().blockSamples;
    const isConfirmed = await this.confirmationOpener.ask({
      question: samples.typedConfirmationQuestion,
      detail: samples.typedConfirmationDetail,
      confirmButton: samples.typedConfirmationConfirm,
      isDestructive: true,
      typedWord: sampleTypedWord,
    });

    this.toastAnswer(isConfirmed);
  }

  private toastAnswer(isConfirmed: boolean): void {
    const samples = this.text().blockSamples;
    this.toastStore.show(isConfirmed ? samples.answeredYes : samples.answeredNo);
  }

  private toastChosen(entry: string): void {
    this.toastStore.show(this.text().blockSamples.chosen(entry));
  }
}
