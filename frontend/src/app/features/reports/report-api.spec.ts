import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { english } from '../../core/languages/english';
import { AdminReportDto } from './admin-report-dto';
import { ReportApi } from './report-api';
import { ReportDecision } from './report-decision';
import { ReportStatus } from './report-status';
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

const missingUserReport: AdminReportDto = {
  id: 9,
  targetType: ReportTargetType.User,
  targetId: 12,
  reason: 'Impersonation',
  status: ReportStatus.Pending,
  reporter: { id: 2, username: 'mary' },
  reviewedBy: null,
  createdAt: '2026-11-22T10:00:00Z',
  reviewedAt: null,
  targetMissing: true,
  post: null,
  comment: null,
  user: null,
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

  describe('GET /api/reports', () => {
    it('sends only the page when no filter is set, and returns the reports', async () => {
      const pending = reportApi.getAll({ pageNumber: 1, pageSize: 10 });

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'GET' && candidate.url === '/api/reports',
      );
      expect(request.request.params.keys().sort()).toEqual(['pageNumber', 'pageSize']);
      expect(request.request.params.get('pageNumber')).toBe('1');
      expect(request.request.params.get('pageSize')).toBe('10');
      request.flush({ succeeded: true, message: null, data: [missingUserReport], totalCount: 1 });

      expect(await pending).toEqual({ succeeded: true, data: [missingUserReport] });
    });

    it.each(Object.values(ReportStatus))(
      'sends the status %s as its name, not a number',
      async (status) => {
        const pending = reportApi.getAll({ pageNumber: 1, pageSize: 10, status });

        const request = httpTesting.expectOne((candidate) => candidate.url === '/api/reports');
        expect(request.request.params.get('status')).toBe(status);
        request.flush({ succeeded: true, message: null, data: [], totalCount: 0 });
        await pending;
      },
    );

    it.each(Object.values(ReportTargetType))(
      'sends the target type %s as its name, not a number',
      async (targetType) => {
        const pending = reportApi.getAll({ pageNumber: 2, pageSize: 10, targetType });

        const request = httpTesting.expectOne((candidate) => candidate.url === '/api/reports');
        expect(request.request.params.get('targetType')).toBe(targetType);
        expect(request.request.params.has('status')).toBe(false);
        request.flush({ succeeded: true, message: null, data: [], totalCount: 0 });
        await pending;
      },
    );

    it('sends the status and the target type together', async () => {
      const pending = reportApi.getAll({
        pageNumber: 1,
        pageSize: 10,
        status: ReportStatus.Rejected,
        targetType: ReportTargetType.Comment,
      });

      const request = httpTesting.expectOne((candidate) => candidate.url === '/api/reports');
      expect(request.request.params.get('status')).toBe('Rejected');
      expect(request.request.params.get('targetType')).toBe('Comment');
      request.flush({ succeeded: true, message: null, data: [], totalCount: 0 });
      await pending;
    });

    it('returns the failure of a refused read', async () => {
      const pending = reportApi.getAll({ pageNumber: 1, pageSize: 10 });

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/reports')
        .flush(null, { status: 403, statusText: 'Forbidden' });

      expect(await pending).toEqual({
        succeeded: false,
        message: english.httpFailures.forbidden,
        status: 403,
      });
    });
  });

  describe('PUT /api/reports/{id}', () => {
    it.each(Object.values(ReportDecision))(
      'sends the decision %s as its name in the body',
      async (decision) => {
        const pending = reportApi.decide(9, decision);

        const request = httpTesting.expectOne(
          (candidate) => candidate.method === 'PUT' && candidate.url === '/api/reports/9',
        );
        expect(request.request.body).toEqual({ decision });
        request.flush({ succeeded: true, message: 'Report decided', data: null });

        expect(await pending).toEqual({ succeeded: true, message: 'Report decided', data: null });
      },
    );

    it('returns the backend message when the decision is refused', async () => {
      const pending = reportApi.decide(9, ReportDecision.Hide);

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/reports/9')
        .flush({ succeeded: false, message: 'Report already decided', data: null }, badRequest);

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Report already decided',
        status: 400,
      });
    });
  });
});
