import { Dictionary } from '../../core/languages/dictionary';
import { MenuEntry } from '../menu/menu-entry';
import { ContentAction } from './content-action';

// What each action does when its entry is chosen: the post or comment decides.
export type ContentActionHandlers = Record<ContentAction, () => void>;

// Turns the actions contentActionsOffered gave into the entries the "…" menu shows, in the same order,
// with the labels of the current language. Delete is the one destructive entry.
export function contentMenuEntries(
  actions: readonly ContentAction[],
  labels: Dictionary['shared']['content'],
  handlers: ContentActionHandlers,
): MenuEntry[] {
  const labelOf: Record<ContentAction, string> = {
    [ContentAction.Edit]: labels.editEntry,
    [ContentAction.Delete]: labels.deleteEntry,
    [ContentAction.Hide]: labels.hideEntry,
    [ContentAction.MakeVisible]: labels.makeVisibleEntry,
    [ContentAction.Report]: labels.reportEntry,
  };

  return actions.map((action) => ({
    label: labelOf[action],
    isDestructive: action === ContentAction.Delete,
    choose: handlers[action],
  }));
}
