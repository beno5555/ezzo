namespace aspnetproject.Common.ProjectConstants;

public static class Constants
{
    public const int EmailMinLength    = 10;
    public const int EmailMaxLength    = 100;
    public const int UsernameMinLength = 3;
    public const int UsernameMaxlength = EmailMaxLength;
    
    public const int PasswordMinLength     = 6;
    public const int PasswordMaxLength     = 100;
    public const int PasswordHashMaxLength = 44;
    public const int PasswordSaltMaxLength = 44;

    public const int BioMinLength         = 1;
    public const int BioMaxLength         = 300;
    public const int PostTitleMaxLength   = 100;
    public const int PostContentMaxLength = 3000;
    public const int CommentMaxLength     = 500;
    public const int MessageMaxLength     = 1000;

    public const int ModerationStatusMaxLength = 30;

    public const int ReportEnumMaxLength   = 30;
    public const int ReportReasonMaxLength = 500;

    public const int    BytesPerMegabyte      = 1024 * 1024;
    public const int    ImageAddressMaxLength = 200;
    public const string ImagesRequestPath     = "/api/images";

    // Room in an upload request for its text fields and multipart boundaries, on top of the images themselves.
    public const int MultipartTextAllowanceBytes = BytesPerMegabyte;
    
    public const int MinAge                     = 13;
    public const int MaxAge                     = 100;
    public const int UsernameChangeCooldownDays = 20;
    
    public const int FirstPageNumber = 1;
    public const int MinPageSize     = 1;
    public const int DefaultPageSize = 10;
    public const int MaxPageSize     = 100;

    // Up to this page, the offset (page - 1) * MaxPageSize stays inside an int.
    public const int MaxPageNumber = int.MaxValue / MaxPageSize;

    public const double MinutesPerHour = 60;

    public const int LogDetailsMaxLength    = 1000;
    public const int LogActionMaxLength     = 100;
    public const int LogEntityNameMaxLength = 50;

    // Events sent to the automation (docs/backend/automation.md).
    public const string EventWebhookPathSegment       = "webhook";
    public const string EventSignatureHeader          = "X-WebCity-Signature";
    public const int    ExceptionEventStackTraceLines = 15;
    public const string FingerprintSeparator          = "|";

    // The automation calling the backend (docs/backend/auth.md): the header that carries its key, and the name a Log row gives it.
    public const string AutomationApiKeyHeader = "X-Api-Key";
    public const string AutomationActorName    = "Automation";

    // The internal routes (docs/backend/automation.md). In a year without 29 February, a birthday on that day falls on the 28th.
    public const int February                       = 2;
    public const int LeapDay                        = 29;
    public const int LastDayOfFebruaryInACommonYear = LeapDay - 1;
    public const int MaxNotificationRecipients      = 100;

    public static readonly TimeSpan EditMessageWindow = TimeSpan.FromMinutes(20);

    // The two windows of the administrator's activity counts; both end now.
    public static readonly TimeSpan StatisticsShortWindow = TimeSpan.FromDays(7);
    public static readonly TimeSpan StatisticsLongWindow  = TimeSpan.FromDays(30);

    // The weekly digest (GET /api/internal/digest): how far back a friend's post counts, and how many a row carries.
    public static readonly TimeSpan DigestPostWindow = TimeSpan.FromDays(7);
    public const int                DigestPostLimit  = 3;

    public const string EmailRegexPattern    = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";
    // No dots: a username is an address segment (/users/:username), and a dot makes it look like a file name.
    public const string UsernameRegexPattern = "^(?=.*[a-zA-Z])[a-zA-Z0-9_-]+$";
}