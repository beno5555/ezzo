using aspnetproject.Common.Domain;
using aspnetproject.Controllers.Base;
using aspnetproject.Extensions;
using aspnetproject.Infrastructure.Dtos.Internal;
using aspnetproject.Infrastructure.Queries;
using aspnetproject.Infrastructure.Services.Automation.Authentication;
using aspnetproject.Infrastructure.Services.BusinessLogic.Internal;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace aspnetproject.Controllers.Internal;

// The routes only the automation calls. Only its API key opens them: a user's or an administrator's token gets 401.
[Route("api/internal")]
[Authorize(Policy = AutomationAuth.Policies.AutomationOnly)]
public class InternalController : BaseController
{
    private readonly BirthdayService     _birthdayService;
    private readonly NotificationService _notificationService;

    public InternalController(BirthdayService birthdayService, NotificationService notificationService)
    {
        _birthdayService     = birthdayService;
        _notificationService = notificationService;
    }

    [HttpGet]
    [Route("birthdays")]
    [EnableRateLimiting(RateLimitConfig.Policies.InternalReadBirthdays)]
    public async Task<ActionResult<ListResponse<BirthdayRecipientDto>>> GetBirthdays([FromQuery] BirthdayListQuery birthdayQuery)
    {
        var response = await _birthdayService.GetBirthdayRecipientsAsync(birthdayQuery);

        return Ok(response);
    }

    [HttpPost]
    [Route("notifications")]
    [EnableRateLimiting(RateLimitConfig.Policies.InternalSendNotifications)]
    public async Task<ActionResult<ApplicationResponse>> SendNotification([FromBody] SendNotificationDto sendNotificationDto)
    {
        var response = await _notificationService.SendAsync(sendNotificationDto);

        return Ok(response);
    }
}
