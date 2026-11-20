using aspnetproject.Infrastructure.Dtos.Internal;
using aspnetproject.Infrastructure.Dtos.WebsocketsTransfer;

namespace aspnetproject.Infrastructure.Mappers;

public static class NotificationMapper
{
    // Called after validation, which guarantees the kind and the data.
    public static PushNotificationDto ToPush(SendNotificationDto sendNotificationDto)
    {
        return new PushNotificationDto
        {
            Kind = sendNotificationDto.Kind!.Value,
            Data = sendNotificationDto.Data!
        };
    }
}
