import { AdminReportDto } from './admin-report-dto';
import { ReportDecision } from './report-decision';
import { ReportStatus } from './report-status';
import { ReportTargetType } from './report-target-type';
import { reportsClosedWith } from './reports-closed-with';

const report = (id: number, overrides: Partial<AdminReportDto> = {}): AdminReportDto => ({
  id,
  targetType: ReportTargetType.Post,
  targetId: 3,
  reason: 'Spam',
  status: ReportStatus.Pending,
  reporter: { id: 2, username: 'mary' },
  reviewedBy: null,
  createdAt: '2026-11-22T10:00:00Z',
  reviewedAt: null,
  targetMissing: false,
  post: null,
  comment: null,
  user: null,
  ...overrides,
});

describe('reportsClosedWith', () => {
  it('closes the other pending reports on the same target when the decision is Hide', () => {
    const decided = report(1);
    const shown = [decided, report(2), report(3, { targetId: 4 })];

    expect(reportsClosedWith(decided, ReportDecision.Hide, shown).map((r) => r.id)).toEqual([2]);
  });

  it('does not close the report that was decided, nor a report on another kind of target with the same id', () => {
    const decided = report(1);
    const shown = [decided, report(2, { targetType: ReportTargetType.Comment })];

    expect(reportsClosedWith(decided, ReportDecision.Hide, shown)).toEqual([]);
  });

  it('leaves a report that is already closed alone', () => {
    const decided = report(1);
    const shown = [decided, report(2, { status: ReportStatus.Rejected })];

    expect(reportsClosedWith(decided, ReportDecision.Hide, shown)).toEqual([]);
  });

  it('closes no other report when the decision is Reject', () => {
    const decided = report(1);
    const shown = [decided, report(2)];

    expect(reportsClosedWith(decided, ReportDecision.Reject, shown)).toEqual([]);
  });
});
