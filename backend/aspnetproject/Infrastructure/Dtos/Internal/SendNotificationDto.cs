using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using aspnetproject.Common.Json;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Common.ProjectConstants.Enums;

namespace aspnetproject.Infrastructure.Dtos.Internal;

// The body of POST /api/internal/notifications. BIRTHDAY is the only kind, so the data has its shape; a second kind would
// need the data to be read by kind. Nullable so that a missing field fails validation instead of binding to a default.
public class SendNotificationDto
{
    [Required]
    [MinLength(1)]
    [MaxLength(Constants.MaxNotificationRecipients)]
    public List<int>? RecipientIds { get; set; }

    [Required]
    [EnumDataType(typeof(NotificationKind))]
    [JsonConverter(typeof(NotificationKindJsonConverter))]
    public NotificationKind? Kind { get; set; }

    [Required]
    public BirthdayNotificationDataDto? Data { get; set; }
}
