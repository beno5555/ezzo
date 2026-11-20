using aspnetproject.Common.Domain;
using aspnetproject.Controllers.Base;
using aspnetproject.Extensions;
using aspnetproject.Infrastructure.Dtos.Automation;
using aspnetproject.Infrastructure.Queries;
using aspnetproject.Infrastructure.Services.Automation.Authentication;
using aspnetproject.Infrastructure.Services.BusinessLogic.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace aspnetproject.Controllers.Automation;

// Routes only the automation calls, with its API key. A user's token, an administrator's included, gets 401.
[Route("api/internal")]
[Authorize(Policy = AutomationAuth.Policies.AutomationOnly)]
public class InternalController : BaseController
{
    private readonly DigestService _digestService;

    public InternalController(DigestService digestService)
    {
        _digestService = digestService;
    }

    [HttpGet]
    [Route("digest")]
    [EnableRateLimiting(RateLimitConfig.Policies.ReadDigest)]
    public async Task<ActionResult<ListResponse<DigestRecipientDto>>> GetDigest([FromQuery] PageQuery pageQuery)
    {
        var response = await _digestService.GetDigestRecipientsAsync(pageQuery);

        if (response.Succeeded)
        {
            return Ok(response);
        }

        return BadRequest(response);
    }
}
