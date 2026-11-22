import { LIMITS } from '../../core/limits';
import { canSendReport } from './can-send-report';

const max = LIMITS.reports.reasonMaxLength;

describe('canSendReport', () => {
  it.each([
    ['a short reason', 'Spam'],
    ['a reason with spaces around it', '  Spam  '],
    ['a reason of exactly the limit', 'a'.repeat(max)],
  ])('lets %s be sent', (_, reason) => {
    expect(canSendReport(reason)).toBe(true);
  });

  it.each([
    ['nothing', ''],
    ['only spaces and line breaks', '  \n  '],
    ['a reason over the limit', 'a'.repeat(max + 1)],
  ])('does not let %s be sent', (_, reason) => {
    expect(canSendReport(reason)).toBe(false);
  });

  it('keeps the limit the backend sets for a report’s reason', () => {
    expect(max).toBe(500);
  });
});
