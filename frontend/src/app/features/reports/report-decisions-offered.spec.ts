import { AdminReportDto } from './admin-report-dto';
import { ReportDecision } from './report-decision';
import { reportDecisionsOffered } from './report-decisions-offered';
import { ReportStatus } from './report-status';
import { ReportTargetType } from './report-target-type';

const report = (overrides: Partial<AdminReportDto>): AdminReportDto => ({
  id: 1,
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

describe('reportDecisionsOffered', () => {
  it('offers Hide and Reject on a pending report', () => {
    expect(reportDecisionsOffered(report({}))).toEqual([
      ReportDecision.Hide,
      ReportDecision.Reject,
    ]);
  });

  it('offers Reject only on a pending report whose target is gone', () => {
    expect(reportDecisionsOffered(report({ targetMissing: true }))).toEqual([
      ReportDecision.Reject,
    ]);
  });

  it.each([ReportStatus.Resolved, ReportStatus.Rejected])(
    'offers nothing on a %s report',
    (status) => {
      expect(reportDecisionsOffered(report({ status }))).toEqual([]);
    },
  );
});
