using aspnetproject.Common.ProjectConstants;

namespace aspnetproject.Infrastructure.Services.Logging;

public static class LogDetails
{
    // Exception messages (a SQL error, say) can exceed the Log.Details column; an oversized value would make the insert fail.
    public static string? FitToColumn(string? details)
    {
        string? fitted = details;

        bool tooLong = details is not null && details.Length > Constants.LogDetailsMaxLength;
        if (tooLong)
        {
            fitted = details![..Constants.LogDetailsMaxLength];
        }

        return fitted;
    }
}
