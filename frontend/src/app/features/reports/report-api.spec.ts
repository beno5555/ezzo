import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { english } from '../../core/languages/english';
import { ReportApi } from './report-api';
import { ReportTargetType } from './report-target-type';
import { StandardReportDto } from './standard-report-dto';

const created: StandardReportDto = {
  id: 7,
  targetType: ReportTargetType.Post,
  targetId: 3,
  reason: 'Spam',
  status: 'Pending',
  createdAt: '2026-11-22T10:00:00Z',
};

const badRequest = { status: 400, statusText: 'Bad Request' };

describe('ReportApi', () => {
  let reportApi: ReportApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    reportApi = TestBed.inject(ReportApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('POST /api/reports', () => {
    it('sends the target type as its name, with the id and the reason, and returns the report', async () => {
      const pending = reportApi.create({
        targetType: ReportTargetType.Post,
        targetId: 3,
        reason: 'Spam',
      });

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'POST' && candidate.url === '/api/reports',
      );
      expect(request.request.body).toEqual({
        targetType: ReportTargetType.Post,
        targetId: 3,
        reason: 'Spam',
      });
      request.flush({ succeeded: true, message: 'Report created', data: created });

      expect(await pending).toEqual({ succeeded: true, message: 'Report created', data: created });
    });

    it('sends a comment report with the target type Comment', async () => {
      const pending = reportApi.create({
        targetType: ReportTargetType.Comment,
        targetId: 5,
        reason: 'Rude',
      });

      const request = httpTesting.expectOne((candidate) => candidate.url === '/api/reports');
      expect(request.request.body).toEqual({
        targetType: ReportTargetType.Comment,
        targetId: 5,
        reason: 'Rude',
      });
      request.flush({
        succeeded: true,
        message: null,
        data: { ...created, targetType: ReportTargetType.Comment },
      });
      await pending;
    });

    it('returns the backend message when the report is refused', async () => {
      const pending = reportApi.create({
        targetType: ReportTargetType.Post,
        targetId: 3,
        reason: 'Spam',
      });

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/reports')
        .flush({ succeeded: false, message: 'You already reported this', data: null }, badRequest);

      expect(await pending).toEqual({
        succeeded: false,
        message: 'You already reported this',
        status: 400,
      });
    });

    it('returns the validation message and the field errors of a refused reason', async () => {
      const pending = reportApi.create({
        targetType: ReportTargetType.Post,
        targetId: 3,
        reason: 'a'.repeat(501),
      });

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/reports')
        .flush(
          {
            title: 'One or more validation errors occurred.',
            status: 400,
            errors: { Reason: ['The field Reason must be a maximum length of 500.'] },
          },
          badRequest,
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: english.httpFailures.validation,
        status: 400,
        fieldErrors: { reason: ['The field Reason must be a maximum length of 500.'] },
      });
    });
  });
});
