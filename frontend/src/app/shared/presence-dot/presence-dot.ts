import { Component, computed, inject, input } from '@angular/core';
import { DateFormatter } from '../../core/languages/date-formatter';
import { LanguageStore } from '../../core/languages/language-store';

// Whether a friend is online, compact enough for the corner of an avatar in a list row: a green dot while
// they are online; a grey one with how long they have been away ("12m", "3h") inside, under a day; a plain
// grey dot after that. Screen readers hear the words PresenceLabel shows. The ring parts it from the avatar.
// The caller places it, usually on the avatar's corner:
//   <span class="relative">
//     <app-avatar ... />
//     <app-presence-dot class="absolute -end-1 -bottom-1" [lastActiveAt]="friend.lastActiveAt" />
//   </span>
@Component({
  selector: 'app-presence-dot',
  templateUrl: './presence-dot.html',
  styleUrl: './presence-dot.css',
  host: { class: 'flex' },
})
export class PresenceDot {
  readonly lastActiveAt = input.required<string | null>();

  private readonly dateFormatter = inject(DateFormatter);

  protected readonly text = inject(LanguageStore).text;
  protected readonly awayFor = computed(() => {
    const lastActive = this.lastActiveAt();
    return lastActive === null ? null : this.dateFormatter.shortTimeSince(lastActive);
  });
  protected readonly label = computed(() => {
    const lastActive = this.lastActiveAt();
    const presence = this.text().shared.presence;
    return lastActive === null
      ? presence.online
      : presence.lastActive(this.dateFormatter.timeSince(lastActive));
  });
}
