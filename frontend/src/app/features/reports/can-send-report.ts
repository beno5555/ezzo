import { LIMITS } from '../../core/limits';

// The backend's rules for a report's reason (CreateReportDto): text that is not blank and not over its
// length. The Send button stays disabled until they hold, so a reason the backend would refuse for its text
// is never sent.
export function canSendReport(reason: string): boolean {
  const hasText = reason.trim().length > 0;
  const isShortEnough = reason.length <= LIMITS.reports.reasonMaxLength;

  return hasText && isShortEnough;
}
