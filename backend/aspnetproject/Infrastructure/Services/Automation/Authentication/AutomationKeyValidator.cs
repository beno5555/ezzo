using System.Security.Cryptography;
using System.Text;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Infrastructure.Services.Automation.Configuration;
using Microsoft.Extensions.Options;

namespace aspnetproject.Infrastructure.Services.Automation.Authentication;

// The one place that decides whether a request carries the automation's key. The authentication handler and the rate
// limiter both ask it, because the limiter runs before the scheme has authenticated anything.
public class AutomationKeyValidator
{
    private readonly AutomationApiConfiguration _configuration;

    public AutomationKeyValidator(IOptions<AutomationApiConfiguration> configuration)
    {
        _configuration = configuration.Value;
    }

    public bool HasKeyHeader(HttpRequest request)
    {
        return request.Headers.ContainsKey(Constants.AutomationApiKeyHeader);
    }

    // Compared as SHA-256 digests in constant time, so neither the key's content nor its length shows in the response time.
    // An empty configured key never matches, not even an empty header: with no key configured, every caller is refused.
    public bool IsValid(HttpRequest request)
    {
        string sentKey = request.Headers[Constants.AutomationApiKeyHeader].ToString();

        byte[] sentDigest       = SHA256.HashData(Encoding.UTF8.GetBytes(sentKey));
        byte[] configuredDigest = SHA256.HashData(Encoding.UTF8.GetBytes(_configuration.Key ?? string.Empty));

        bool digestsMatch = CryptographicOperations.FixedTimeEquals(sentDigest, configuredDigest);
        bool hasKey       = _configuration.HasKey();

        return hasKey && digestsMatch;
    }
}
