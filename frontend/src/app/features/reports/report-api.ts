import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ApplicationResponse } from '../../core/http/application-response';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { NewReport } from './new-report';
import { StandardReportDto } from './standard-report-dto';

// The backend's ReportController (/api/reports). Only making a report is here: the administrator's list
// and decisions arrive with the admin reports page. Every refusal (own content, a report already pending,
// content that is gone or hidden) is a 400 with a message.
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
}
