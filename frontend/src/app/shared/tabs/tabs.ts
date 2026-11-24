import { Component, ElementRef, computed, input, model, viewChildren } from '@angular/core';
import { Tab } from './tab';
import { panelId, tabId } from './tab-ids';

const sharedTabClasses =
  'min-h-11 shrink-0 cursor-pointer whitespace-nowrap border-b-2 px-2 text-sm font-semibold md:px-4 md:text-base transition-colors ' +
  'motion-reduce:transition-none focus-visible:outline-2 focus-visible:-outline-offset-2 ' +
  'focus-visible:outline-focus';
const selectedTabClasses = 'border-accent text-accent';
const otherTabClasses = 'border-transparent text-ink-muted hover:text-ink-strong';

// A row of tabs that switches what a page shows below it, with the keyboard behaviour of the ARIA tabs
// pattern: Tab reaches the selected tab only, the left and right arrows (and Home and End) move to another
// tab and show it. The page draws each panel itself, with the ids from tab-ids:
//   <app-tabs idPrefix="profile" [tabs]="tabs()" [label]="..." [(selected)]="tab" />
//   <div role="tabpanel" [id]="panelId('profile', tab())" [attr.aria-labelledby]="tabId('profile', tab())">
@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.html',
  styleUrl: './tabs.css',
})
export class Tabs {
  readonly tabs = input.required<readonly Tab[]>();
  readonly idPrefix = input.required<string>();
  // Names the row for screen readers.
  readonly label = input.required<string>();
  // The key of the shown tab.
  readonly selected = model.required<string>();

  private readonly buttons = viewChildren<ElementRef<HTMLButtonElement>>('tabButton');
  protected readonly keys = computed(() => this.tabs().map((tab) => tab.key));

  protected tabIdOf(tabKey: string): string {
    return tabId(this.idPrefix(), tabKey);
  }

  protected panelIdOf(tabKey: string): string {
    return panelId(this.idPrefix(), tabKey);
  }

  protected classesOf(tabKey: string): string {
    const isSelected = tabKey === this.selected();

    return `${sharedTabClasses} ${isSelected ? selectedTabClasses : otherTabClasses}`;
  }

  select(tabKey: string): void {
    this.selected.set(tabKey);
  }

  onKeydown(event: KeyboardEvent): void {
    const keys = this.keys();
    const current = keys.indexOf(this.selected());
    const lastIndex = keys.length - 1;
    const target: Record<string, number> = {
      ArrowRight: current === lastIndex ? 0 : current + 1,
      ArrowLeft: current === 0 ? lastIndex : current - 1,
      Home: 0,
      End: lastIndex,
    };
    const next = target[event.key];

    if (next !== undefined) {
      event.preventDefault();
      this.select(keys[next]);
      this.buttons()[next]?.nativeElement.focus();
    }
  }
}
