using aspnetproject.Common.ProjectConstants;
using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.Infrastructure.Dtos.Automation;

namespace aspnetproject.Infrastructure.Mappers;

public static class ExceptionEventMapper
{
    // path is the request path alone; a caller never passes the query string.
    public static ExceptionOccurredEventDto ToRequestEvent(Exception exception, string httpMethod, string path)
    {
        return ToEvent(exception, ExceptionPlaceKind.Request, $"{httpMethod} {path}");
    }

    public static ExceptionOccurredEventDto ToJobEvent(Exception exception, string jobName)
    {
        return ToEvent(exception, ExceptionPlaceKind.Job, jobName);
    }

    private static ExceptionOccurredEventDto ToEvent(Exception exception, ExceptionPlaceKind placeKind, string place)
    {
        string exceptionType = exception.GetType().FullName ?? exception.GetType().Name;

        return new ExceptionOccurredEventDto
        {
            ExceptionType = exceptionType,
            Message       = exception.Message,
            StackTrace    = FirstStackTraceLines(exception.StackTrace),

            PlaceKind = placeKind,
            Place     = place,

            Fingerprint = $"{exceptionType}{Constants.FingerprintSeparator}{place}"
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
