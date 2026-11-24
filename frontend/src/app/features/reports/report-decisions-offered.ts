import { AdminReportDto } from './admin-report-dto';
import { ReportDecision } from './report-decision';
import { ReportStatus } from './report-status';

// The decisions an administrator can make on a report: only a pending report is decided, and a report
// whose target is gone can only be rejected, because the backend refuses to hide what does not exist.
export function reportDecisionsOffered(report: AdminReportDto): ReportDecision[] {
  const isPending = report.status === ReportStatus.Pending;
  const canHide = isPending && !report.targetMissing;
  const decisions: ReportDecision[] = [];

  if (canHide) {
    decisions.push(ReportDecision.Hide);
  }
  if (isPending) {
    decisions.push(ReportDecision.Reject);
  }

  return decisions;
}
