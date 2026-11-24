import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ApplicationResponse } from '../../core/http/application-response';
import { ListResponse } from '../../core/http/list-response';
import { pageParams } from '../../core/http/page-params';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { AdminReportDto } from './admin-report-dto';
import { NewReport } from './new-report';
import { ReportDecision } from './report-decision';
import { ReportListQuery } from './report-list-query';
import { StandardReportDto } from './standard-report-dto';

// The backend's ReportController (/api/reports): making a report is for any signed-in user, the list and
// the decision for an administrator only. Every refusal of a report or a decision (own content, a report
// already pending, content that is gone or hidden, a report already decided) is a 400 with a message.
@Injectable({ providedIn: 'root' })
export class ReportApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

  // The target type goes as its name. The reason is limited to LIMITS.reports.reasonMaxLength.
  create(report: NewReport): Promise<AppResult<StandardReportDto>> {
    return toAppResult(
      this.http.post<ApplicationResponse<StandardReportDto>>('/api/reports', {
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
      }),
      this.languageStore.text().httpFailures,
    );
  }

  // Reports, newest first. The status and the target type go as their names, and a filter left out is left
  // out of the address: with no status the backend lists the pending reports.
  getAll(query: ReportListQuery): Promise<AppResult<AdminReportDto[]>> {
    const { status, targetType } = query;
    let params = pageParams(query);

    if (status !== undefined) {
      params = params.set('status', status);
    }
    if (targetType !== undefined) {
      params = params.set('targetType', targetType);
    }

    return toAppResult(
      this.http.get<ListResponse<AdminReportDto>>('/api/reports', { params }),
      this.languageStore.text().httpFailures,
    );
  }

  // Closes a pending report. Hide hides a post or a comment, or deactivates a user, and closes every other
  // pending report on the same target; Reject closes this report alone.
  decide(reportId: number, decision: ReportDecision): Promise<AppResult<void>> {
    return toAppResult(
      this.http.put<ApplicationResponse<void>>(`/api/reports/${reportId}`, { decision }),
      this.languageStore.text().httpFailures,
    );
  }
}
