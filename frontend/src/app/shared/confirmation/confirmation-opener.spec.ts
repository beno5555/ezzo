import { Dialog } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { ConfirmationOpener } from './confirmation-opener';
import { ConfirmationQuestion } from './confirmation-question';

const deletePost: ConfirmationQuestion = {
  question: 'Delete this post?',
  confirmButton: 'Delete',
  isDestructive: true,
};

// A stand-in for the CDK dialog: the test closes it the way the dialog would, with the answer the
// confirmation gives (true, false), or with nothing on Escape and on a click outside.
describe('ConfirmationOpener', () => {
  let confirmationOpener: ConfirmationOpener;
  let closed: Subject<boolean | undefined>;

  beforeEach(() => {
    closed = new Subject<boolean | undefined>();
    const fakeDialog = { open: () => ({ closed, config: {} }) };
    TestBed.configureTestingModule({ providers: [{ provide: Dialog, useValue: fakeDialog }] });
    confirmationOpener = TestBed.inject(ConfirmationOpener);
  });

  async function answerWhenClosedWith(result: boolean | undefined): Promise<boolean> {
    const answer = confirmationOpener.ask(deletePost);
    closed.next(result);
    closed.complete();

    return answer;
  }

  it('answers yes when the user confirms', async () => {
    expect(await answerWhenClosedWith(true)).toBe(true);
  });

  it('answers no when the user cancels', async () => {
    expect(await answerWhenClosedWith(false)).toBe(false);
  });

  it('answers no when the dialog closes on Escape or on a click outside', async () => {
    expect(await answerWhenClosedWith(undefined)).toBe(false);
  });
});
