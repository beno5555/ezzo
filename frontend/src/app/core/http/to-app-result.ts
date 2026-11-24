import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Observable, catchError, firstValueFrom, from, map, of, throwError } from 'rxjs';
import { Dictionary } from '../languages/dictionary';
import { AppResult, FieldErrors, fail, ok } from './app-result';
import { ApplicationResponse } from './application-response';

type HttpFailureTexts = Dictionary['httpFailures'];
type FailureTextsSource = HttpFailureTexts | (() => Promise<HttpFailureTexts>);

// failureTexts come from the current dictionary, passed in by the …Api method, which can inject LanguageStore.
export function toAppResult<T>(
  request: Observable<ApplicationResponse<T>>,
  failureTexts: HttpFailureTexts,
): Promise<AppResult<T>> {
  return settle(request, (body) => ok(body.data as T, body.message ?? undefined), failureTexts);
}

// For the endpoints that answer success without the envelope: login and refresh ({ accessToken })
// and logout (an empty body). Their failures still arrive as the envelope or bodiless.
export function toAppResultWithoutEnvelope<T>(
  request: Observable<T>,
  failureTexts: FailureTextsSource,
): Promise<AppResult<T>> {
  return settle(request, (body) => ok(body), failureTexts);
}

function settle<TBody, T>(
  request: Observable<TBody>,
  toSuccess: (body: TBody) => AppResult<T>,
  failureTexts: FailureTextsSource,
): Promise<AppResult<T>> {
  return firstValueFrom(
    request.pipe(
      map(toSuccess),
      catchError((error: unknown) => {
        const isHttpFailure = error instanceof HttpErrorResponse;
        let failure: Observable<AppResult<T>> = throwError(() => error);
        if (isHttpFailure) {
          failure =
            typeof failureTexts === 'function'
              ? from(failureTexts()).pipe(map((texts) => toFailure<T>(error, texts)))
              : of(toFailure<T>(error, failureTexts));
        }

        return failure;
      }),
    ),
  );
}

function toFailure<T>(error: HttpErrorResponse, failureTexts: HttpFailureTexts): AppResult<T> {
  let result: AppResult<T>;
  const body: unknown = error.error;

  if (isEnvelope(body)) {
    result = fail<T>(body.message, error.status);
  } else if (isValidationProblem(body)) {
    result = fail<T>(failureTexts.validation, error.status, toFieldErrors(body.errors));
  } else {
    result = fail<T>(failureTexts[fixedTextKeyFor(error.status)], error.status);
  }

  return result;
}

// HttpClient reports status 0 when no response arrived at all: offline, refused, or the proxy is down.
const noResponseStatus = 0;

// Failures without a message of their own: no response, and the framework's bodiless rejections
// (a missing token, a wrong role, an unmatched route). Any other status gets the unexpected text.
const fixedTextKeys: Partial<Record<number, keyof HttpFailureTexts>> = {
  [noResponseStatus]: 'network',
  [HttpStatusCode.Unauthorized]: 'unauthorized',
  [HttpStatusCode.Forbidden]: 'forbidden',
  [HttpStatusCode.NotFound]: 'notFound',
};

function fixedTextKeyFor(status: number): keyof HttpFailureTexts {
  return fixedTextKeys[status] ?? 'unexpected';
}

function isObject(value: unknown): value is object {
  return typeof value === 'object' && value !== null;
}

function isEnvelope(body: unknown): body is { succeeded: false; message: string } {
  const hasMessage = isObject(body) && 'message' in body && typeof body.message === 'string';
  const isFailure = hasMessage && 'succeeded' in body && body.succeeded === false;

  return isFailure;
}

// The framework's ValidationProblemDetails: an errors map of field name to messages.
function isValidationProblem(body: unknown): body is { errors: FieldErrors } {
  return isObject(body) && 'errors' in body && isObject(body.errors);
}

// The backend names fields as C# properties (DateOfBirth); the DTO types and forms use camelCase.
function toFieldErrors(errors: FieldErrors): FieldErrors {
  const entries = Object.entries(errors).map(([field, messages]) => [
    field.charAt(0).toLowerCase() + field.slice(1),
    messages,
  ]);

  return Object.fromEntries(entries) as FieldErrors;
}
