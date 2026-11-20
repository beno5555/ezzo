using System.Text.Json.Serialization;
using aspnetproject.Common.Json;
using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.Infrastructure.Dtos.Internal;

namespace aspnetproject.Infrastructure.Dtos.WebsocketsTransfer;

// The payload of ReceiveNotification: the kind and the data exactly as the automation sent them.
public class PushNotificationDto
{
    [JsonConverter(typeof(NotificationKindJsonConverter))]
    public NotificationKind            Kind { get; set; }
    public BirthdayNotificationDataDto Data { get; set; } = null!;
}
