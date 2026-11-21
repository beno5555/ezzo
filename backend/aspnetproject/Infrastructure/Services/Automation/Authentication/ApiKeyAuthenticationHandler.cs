using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace aspnetproject.Infrastructure.Services.Automation.Authentication;

// The second authentication scheme, beside JWT. It succeeds only for a request whose X-Api-Key header holds the configured key,
// and then gives it an identity with no claims at all: no id, no name, no role. A request without the header is left alone
// (NoResult); a request with a wrong or empty key fails.
// Only a route that names this scheme in its policy (AutomationAuth.Policies) ever runs it, so every other route ignores the key.
public class ApiKeyAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    private const string InvalidKeyMessage = "The API key is not valid.";

    private readonly AutomationKeyValidator _keyValidator;

    public ApiKeyAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory                               logger,
        UrlEncoder                                   encoder,
        AutomationKeyValidator                       keyValidator
        ) : base(options, logger, encoder)
    {
        _keyValidator = keyValidator;
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var result = AuthenticateResult.NoResult();

        bool hasKeyHeader = _keyValidator.HasKeyHeader(Request);

        if (hasKeyHeader)
        {
            bool keyIsValid = _keyValidator.IsValid(Request);

            if (keyIsValid)
            {
                var identity  = new ClaimsIdentity(authenticationType: Scheme.Name);
                var principal = new ClaimsPrincipal(identity);

                result = AuthenticateResult.Success(new AuthenticationTicket(principal, Scheme.Name));
            }
            else
            {
                result = AuthenticateResult.Fail(InvalidKeyMessage);
            }
        }

        return Task.FromResult(result);
    }
}
