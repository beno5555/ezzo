using aspnetproject.Infrastructure.Services.Automation.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace aspnetproject.IntegrationTests.Helpers;

// A route that exists only in the test host (CustomWebApplicationFactory adds this assembly's controllers), so the rule for
// routes under /api/internal is tested before any real route applies it: only the key opens it, an administrator's token does not.
[ApiController]
[Route(RouteTemplate)]
[Authorize(Policy = AutomationAuth.Policies.AutomationOnly)]
public class AutomationOnlyProbeController : ControllerBase
{
    public const string RouteTemplate = "api/internal/probe";

    [HttpGet]
    public IActionResult Get()
    {
        return Ok();
    }
}
