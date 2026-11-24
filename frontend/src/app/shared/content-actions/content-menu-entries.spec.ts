import { english } from '../../core/languages/english';
import { ContentAction } from './content-action';
import { ContentActionHandlers, contentMenuEntries } from './content-menu-entries';

const labels = english.shared.content;

describe('contentMenuEntries', () => {
  it('turns each action into an entry with its label, in the same order', () => {
    const noop = () => undefined;
    const handlers: ContentActionHandlers = {
      [ContentAction.Edit]: noop,
      [ContentAction.Delete]: noop,
      [ContentAction.Hide]: noop,
      [ContentAction.MakeVisible]: noop,
      [ContentAction.Report]: noop,
    };

    const entries = contentMenuEntries(
      [
        ContentAction.Edit,
        ContentAction.Delete,
        ContentAction.Hide,
        ContentAction.MakeVisible,
        ContentAction.Report,
      ],
      labels,
      handlers,
    );

    expect(entries.map((entry) => entry.label)).toEqual([
      'Edit',
      'Delete',
      'Hide',
      'Make visible',
      'Report',
    ]);
  });

  it('marks only Delete as destructive', () => {
    const noop = () => undefined;
    const handlers = Object.fromEntries(
      Object.values(ContentAction).map((action) => [action, noop]),
    ) as ContentActionHandlers;

    const entries = contentMenuEntries(Object.values(ContentAction), labels, handlers);

    expect(entries.filter((entry) => entry.isDestructive).map((entry) => entry.label)).toEqual([
      'Delete',
    ]);
  });

  it('runs the handler of the chosen action', () => {
    const reported = vi.fn();
    const handlers = {
      [ContentAction.Edit]: vi.fn(),
      [ContentAction.Delete]: vi.fn(),
      [ContentAction.Hide]: vi.fn(),
      [ContentAction.MakeVisible]: vi.fn(),
      [ContentAction.Report]: reported,
    };

    const [entry] = contentMenuEntries([ContentAction.Report], labels, handlers);
    entry.choose();

    expect(reported).toHaveBeenCalledOnce();
  });

  it('gives nothing for no actions', () => {
    expect(contentMenuEntries([], labels, {} as ContentActionHandlers)).toEqual([]);
  });
});
