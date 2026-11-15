import { HttpErrorResponse, HttpStatusCode } from '@angular/common/http';
import { Observable, catchError, firstValueFrom, map, of, throwError } from 'rxjs';
import { AppResult, FieldErrors, fail, ok } from './app-result';
import { ApplicationResponse } from './application-response';
import { httpFailureTexts } from './http-failure-texts';

export function toAppResult<T>(request: Observable<ApplicationResponse<T>>): Promise<AppResult<T>> {
  return firstValueFrom(
    request.pipe(
      map((body) => ok(body.data as T, body.message ?? undefined)),
      catchError((error: unknown) => {
        const isHttpFailure = error instanceof HttpErrorResponse;
        return isHttpFailure ? of(toFailure<T>(error)) : throwError(() => error);
      }),
    ),
  );
}

function toFailure<T>(error: HttpErrorResponse): AppResult<T> {
  let result: AppResult<T>;
  const body: unknown = error.error;

  if (isEnvelope(body)) {
    result = fail<T>(body.message, error.status);
  } else if (isValidationProblem(body)) {
    result = fail<T>(httpFailureTexts.validation, error.status, toFieldErrors(body.errors));
  } else {
    result = fail<T>(fixedTextFor(error.status), error.status);
  }

  return result;
}

// HttpClient reports status 0 when no response arrived at all: offline, refused, or the proxy is down.
const noResponseStatus = 0;

// Failures without a message of their own: no response, and the framework's bodiless rejections
// (a missing token, a wrong role, an unmatched route). Any other status gets the unexpected text.
const fixedTexts: Partial<Record<number, string>> = {
  [noResponseStatus]: httpFailureTexts.network,
  [HttpStatusCode.Unauthorized]: httpFailureTexts.unauthorized,
  [HttpStatusCode.Forbidden]: httpFailureTexts.forbidden,
  [HttpStatusCode.NotFound]: httpFailureTexts.notFound,
};

function fixedTextFor(status: number): string {
  return fixedTexts[status] ?? httpFailureTexts.unexpected;
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
