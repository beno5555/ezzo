using aspnetproject.Common.Domain;
using aspnetproject.Controllers.Base;
using aspnetproject.Extensions;
using aspnetproject.Infrastructure.Dtos.Moderation;
using aspnetproject.Infrastructure.Services.Automation.Authentication;
using aspnetproject.Infrastructure.Services.BusinessLogic.Content;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace aspnetproject.Controllers.Admin;

// The two routes the automation may call besides an administrator: setting a moderation status. They share AdminController's
// route, but not its authorization (an attribute on a class cannot be loosened on an action), so they live here.
// What the automation may set is decided in ModerationService, which is told who the caller is.
[Route("api/admin")]
[Authorize(Policy = AutomationAuth.Policies.AdministratorOrAutomation)]
public class ModerationController : BaseController
{
    private readonly ModerationService _moderationService;

    public ModerationController(ModerationService moderationService)
    {
        _moderationService = moderationService;
    }

    [HttpPut]
    [Route("posts/{id:int}/moderation")]
    [EnableRateLimiting(RateLimitConfig.Policies.AdminModeratePost)]
    public async Task<ActionResult<ApplicationResponse>> SetPostStatus(int id, [FromBody] SetModerationStatusDto setModerationStatusDto)
    {
        var response = await _moderationService.SetPostStatusAsync(id, setModerationStatusDto.Status!.Value, IsAutomation());

        if (response.Succeeded)
        {
            return Ok(response);
        }

        // Not Forbid(): that hands the request to an authentication handler and answers with no body. The refusal carries the envelope.
        if (response.Refused)
        {
            return StatusCode(StatusCodes.Status403Forbidden, response);
        }

        return NotFound(response);
    }

    [HttpPut]
    [Route("comments/{id:int}/moderation")]
    [EnableRateLimiting(RateLimitConfig.Policies.AdminModerateComment)]
    public async Task<ActionResult<ApplicationResponse>> SetCommentStatus(int id, [FromBody] SetModerationStatusDto setModerationStatusDto)
    {
        var response = await _moderationService.SetCommentStatusAsync(id, setModerationStatusDto.Status!.Value, IsAutomation());

        if (response.Succeeded)
        {
            return Ok(response);
        }

        if (response.Refused)
        {
            return StatusCode(StatusCodes.Status403Forbidden, response);
        }

        return NotFound(response);
    }
}
