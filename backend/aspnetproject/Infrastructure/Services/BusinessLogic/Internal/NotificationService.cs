using aspnetproject.Common.Domain;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Hubs;
using aspnetproject.Infrastructure.Dtos.Automation;
using aspnetproject.Infrastructure.Mappers;
using aspnetproject.Infrastructure.Services.BusinessLogic.Base;
using aspnetproject.Infrastructure.Services.Logging;
using Microsoft.AspNetCore.SignalR;

namespace aspnetproject.Infrastructure.Services.BusinessLogic.Internal;

// Delivers the automation's notifications to users who are connected. Nothing is stored: a recipient who is not connected,
// or does not exist, has an empty hub group, so the push reaches nobody and nothing fails.
public class NotificationService : BaseService
{
    private readonly IHubContext<MessageHub> _hubContext;

    public NotificationService(IHubContext<MessageHub> hubContext, DatabaseLogger dbLogger) : base(dbLogger)
    {
        _hubContext = hubContext;
    }

    public async Task<ApplicationResponse> SendAsync(SendNotificationDto sendNotificationDto)
    {
        var response = new ApplicationResponse();

        var notification = NotificationMapper.ToPush(sendNotificationDto);

        // A recipient named twice is told once.
        var groups = sendNotificationDto.RecipientIds!.Distinct().Select(recipientId => recipientId.ToString()).ToList();

        await _hubContext.Clients.Groups(groups).SendAsync("ReceiveNotification", notification);

        response.Ok(ResponseMessages.NotificationSent);

        return response;
    }
}
