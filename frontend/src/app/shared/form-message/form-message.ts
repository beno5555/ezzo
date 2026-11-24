import { Component, computed, input } from '@angular/core';
import LucideCircleCheck from 'lucide/dist/esm/icons/circle-check.mjs';
import LucideCircleExclamationPoint from 'lucide/dist/esm/icons/circle-exclamation-point.mjs';
import { Icon } from '../icon/icon';
import { FormMessageTone } from './form-message-tone';

// A message about a whole form, with an icon so that colour never carries the meaning alone (DESIGN.md):
// a failure (the server's message, above the submit button) or a success (a notice at the form's top).
// Screen readers announce a failure at once (role alert) and a success politely (role status).
//   <app-form-message tone="danger" [message]="message" />
@Component({
  selector: 'app-form-message',
  imports: [Icon],
  templateUrl: './form-message.html',
  styleUrl: './form-message.css',
  host: { class: 'block', '[attr.role]': 'role()' },
})
export class FormMessage {
  protected readonly icons = {
    circleCheck: LucideCircleCheck,
    circleExclamationPoint: LucideCircleExclamationPoint,
  };

  readonly tone = input.required<FormMessageTone>();
  readonly message = input.required<string>();

  protected readonly isDanger = computed(() => this.tone() === FormMessageTone.Danger);
  protected readonly role = computed(() => (this.isDanger() ? 'alert' : 'status'));
}
