import { Component, input } from '@angular/core';

// One section of the settings page: a card with its heading. Screen readers hear the heading as the
// section's name. The danger zone's edge is in danger, so it reads apart from the others.
//   <app-settings-section headingId="settings-profile" [heading]="text().users.settings.profile.heading">
@Component({
  selector: 'app-settings-section',
  templateUrl: './settings-section.html',
  styleUrl: './settings-section.css',
  host: { class: 'block' },
})
export class SettingsSection {
  readonly heading = input.required<string>();
  // The id of the heading, which names the section.
  readonly headingId = input.required<string>();
  readonly isDanger = input(false);
}
