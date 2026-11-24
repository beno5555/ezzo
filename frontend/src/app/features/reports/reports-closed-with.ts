import { AdminReportDto } from './admin-report-dto';
import { ReportDecision } from './report-decision';
import { ReportStatus } from './report-status';

// The other reports the server closes together with a decision: Hide closes every other pending report on
// the same target, Reject closes this report alone. The page takes these out of its list with the report.
export function reportsClosedWith(
  report: AdminReportDto,
  decision: ReportDecision,
  shown: readonly AdminReportDto[],
): AdminReportDto[] {
  const isHide = decision === ReportDecision.Hide;
  const isOnSameTarget = (other: AdminReportDto) =>
    other.id !== report.id &&
    other.status === ReportStatus.Pending &&
    other.targetType === report.targetType &&
    other.targetId === report.targetId;

  return isHide ? shown.filter(isOnSameTarget) : [];
}
