using aspnetproject.Common.ProjectConstants;
using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.Infrastructure.Dtos.Automation;

namespace aspnetproject.Infrastructure.Mappers;

public static class ExceptionEventMapper
{
    // path is the request path alone; a caller never passes the query string. routeTemplate is the matched route's
    // template (api/posts/{id:int}), null when no route matched. The place names the address; the fingerprint names the
    // template, so one failure at many ids groups as one.
    public static ExceptionOccurredEventDto ToRequestEvent(
        Exception exception,
        string    httpMethod,
        string    path,
        string?   routeTemplate
        )
    {
        bool   matchedRoute    = routeTemplate is not null;
        string fingerprintPath = matchedRoute ? $"/{routeTemplate!.TrimStart('/')}" : path;

        return ToEvent(exception, ExceptionPlaceKind.Request, $"{httpMethod} {path}", $"{httpMethod} {fingerprintPath}");
    }

    public static ExceptionOccurredEventDto ToJobEvent(Exception exception, string jobName)
    {
        return ToEvent(exception, ExceptionPlaceKind.Job, jobName, jobName);
    }

    private static ExceptionOccurredEventDto ToEvent(
        Exception          exception,
        ExceptionPlaceKind placeKind,
        string             place,
        string             fingerprintPlace
        )
    {
        string exceptionType = exception.GetType().FullName ?? exception.GetType().Name;

        return new ExceptionOccurredEventDto
        {
            ExceptionType = exceptionType,
            Message       = exception.Message,
            StackTrace    = FirstStackTraceLines(exception.StackTrace),

            PlaceKind = placeKind,
            Place     = place,

            Fingerprint = $"{exceptionType}{Constants.FingerprintSeparator}{fingerprintPlace}"
        };
    }

    private static string FirstStackTraceLines(string? stackTrace)
    {
        var lines = (stackTrace ?? string.Empty)
            .Split('\n')
            .Select(line => line.TrimEnd('\r'))
            .Take(Constants.ExceptionEventStackTraceLines);

        return string.Join('\n', lines);
    }
}
