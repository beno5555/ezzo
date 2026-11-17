using System.Text.Json.Serialization;
using aspnetproject.Common.ProjectConstants.Enums;

namespace aspnetproject.Infrastructure.Dtos.Automation;

// The data of exception-occurred. It names where the exception happened but carries nothing from the request itself:
// no body, no header, no query string (hub connections carry the access token there) and no user data.
public class ExceptionOccurredEventDto
{
    public string ExceptionType { get; set; } = string.Empty;
    public string Message       { get; set; } = string.Empty;
    public string StackTrace    { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter<ExceptionPlaceKind>))]
    public ExceptionPlaceKind PlaceKind { get; set; }
    public string             Place     { get; set; } = string.Empty;

    // The type and the place, so repeats of one failure can be grouped.
    public string Fingerprint { get; set; } = string.Empty;
}
