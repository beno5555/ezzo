using System.Text.Json;
using System.Text.Json.Serialization;
using aspnetproject.Common.ProjectConstants.Enums;

namespace aspnetproject.Common.Json;

// Notification kinds by name only, written in upper snake case (BIRTHDAY) and read case-insensitively. A number or an unknown
// name fails validation.
public class NotificationKindJsonConverter : JsonStringEnumConverter<NotificationKind>
{
    public NotificationKindJsonConverter() : base(namingPolicy: JsonNamingPolicy.SnakeCaseUpper, allowIntegerValues: false)
    {

    }
}
