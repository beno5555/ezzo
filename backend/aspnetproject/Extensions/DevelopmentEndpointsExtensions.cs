using aspnetproject.Common.ProjectConstants;

namespace aspnetproject.Extensions;

public static class DevelopmentEndpointsExtensions
{
    // The optional id is never read. It lets one route be reached at many addresses, as /api/posts/{id} is, to show that
    // their failures share one fingerprint.
    public const string ThrowingRoute = "api/dev/throw/{id:int?}";

    // Mapped only in Development, as Swagger is. No real route can be made to fail on request, and the tests, the
    // exception workflow's checklist and the demo all need an unhandled exception: this one reaches GlobalExceptionHandler.
    public static void MapThrowingEndpoint(this WebApplication app)
    {
        app.MapGet(ThrowingRoute, ThrowOnPurpose)
            .RequireRateLimiting(RateLimitConfig.Policies.ThrowOnPurpose)
            .ExcludeFromDescription();
    }

    private static IResult ThrowOnPurpose()
    {
        throw new InvalidOperationException(ResponseMessages.ThrownOnPurpose);
    }
}
