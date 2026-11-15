import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ApplicationResponse } from './application-response';
import { httpFailureTexts } from './http-failure-texts';
import { toAppResult } from './to-app-result';

const address = '/api/anything';

describe('toAppResult', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('turns a success envelope into a success with its data and message', async () => {
    const pending = toAppResult(http.get<ApplicationResponse<number>>(address));

    httpTesting.expectOne(address).flush({ succeeded: true, message: 'Found', data: 42 });

    expect(await pending).toEqual({ succeeded: true, message: 'Found', data: 42 });
  });

  it('turns a failure envelope into a failure with its message and status', async () => {
    const pending = toAppResult(http.get<ApplicationResponse<number>>(address));

    httpTesting
      .expectOne(address)
      .flush(
        { succeeded: false, message: 'Invalid username or password' },
        { status: 400, statusText: 'Bad Request' },
      );

    expect(await pending).toEqual({
      succeeded: false,
      message: 'Invalid username or password',
      status: 400,
    });
  });

  it('turns a validation response into field errors keyed by camelCase names', async () => {
    const pending = toAppResult(http.get<ApplicationResponse<number>>(address));

    httpTesting.expectOne(address).flush(
      {
        type: 'https://tools.ietf.org/html/rfc9110#section-15.5.1',
        title: 'One or more validation errors occurred.',
        status: 400,
        errors: {
          Username: ['The Username field is required.'],
          DateOfBirth: ['Age exceeds the maximum allowed (100).'],
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(await pending).toEqual({
      succeeded: false,
      message: httpFailureTexts.validation,
      status: 400,
      fieldErrors: {
        username: ['The Username field is required.'],
        dateOfBirth: ['Age exceeds the maximum allowed (100).'],
      },
    });
  });

  it.each([
    { status: 401, statusText: 'Unauthorized', message: httpFailureTexts.unauthorized },
    { status: 403, statusText: 'Forbidden', message: httpFailureTexts.forbidden },
    { status: 404, statusText: 'Not Found', message: httpFailureTexts.notFound },
  ])('turns a bodiless $status into a fixed text', async ({ status, statusText, message }) => {
    const pending = toAppResult(http.get<ApplicationResponse<number>>(address));

    httpTesting.expectOne(address).flush(null, { status, statusText });

    expect(await pending).toEqual({ succeeded: false, message, status });
  });

  it('turns a network failure into a fixed text with status 0', async () => {
    const pending = toAppResult(http.get<ApplicationResponse<number>>(address));

    httpTesting.expectOne(address).error(new ProgressEvent('error'));

    expect(await pending).toEqual({
      succeeded: false,
      message: httpFailureTexts.network,
      status: 0,
    });
  });
});
