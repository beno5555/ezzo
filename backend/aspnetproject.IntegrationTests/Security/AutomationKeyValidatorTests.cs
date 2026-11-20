using aspnetproject.Common.ProjectConstants;
using aspnetproject.Infrastructure.Services.Automation.Authentication;
using aspnetproject.Infrastructure.Services.Automation.Configuration;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

namespace aspnetproject.IntegrationTests.Security;

// The validator on its own, because the test host cannot send every case: its in-memory transport drops a header whose value is
// empty, so a request with `X-Api-Key:` and nothing after it arrives as a request with no header at all. Kestrel delivers it.
public class AutomationKeyValidatorTests
{
    private const string ConfiguredKey = "a-configured-key";

    private static AutomationKeyValidator ValidatorWithKey(string configuredKey)
    {
        var configuration = new AutomationApiConfiguration { Key = configuredKey };

        return new AutomationKeyValidator(Options.Create(configuration));
    }

    private static HttpRequest RequestWithKeyHeader(string? sentKey)
    {
        var request = new DefaultHttpContext().Request;

        if (sentKey is not null)
        {
            request.Headers[Constants.AutomationApiKeyHeader] = sentKey;
        }

        return request;
    }

    [Fact]
    public void IsValid_WithTheConfiguredKey_ReturnsTrue()
    {
        var validator = ValidatorWithKey(ConfiguredKey);

        bool isValid = validator.IsValid(RequestWithKeyHeader(ConfiguredKey));

        Assert.True(isValid);
    }

    [Theory]
    [InlineData("another-key")]
    [InlineData("A-CONFIGURED-KEY")]
    [InlineData("a-configured-key ")]
    [InlineData("a-configured")]
    [InlineData("")]
    [InlineData(null)]
    public void IsValid_WithAnyOtherKey_ReturnsFalse(string? sentKey)
    {
        var validator = ValidatorWithKey(ConfiguredKey);

        bool isValid = validator.IsValid(RequestWithKeyHeader(sentKey));

        Assert.False(isValid);
    }

    // With no key configured nobody matches, including a caller who sends an empty key: two empty values must not count as equal.
    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    [InlineData(ConfiguredKey)]
    public void IsValid_WithNoKeyConfigured_ReturnsFalse(string? sentKey)
    {
        var validator = ValidatorWithKey(string.Empty);

        bool isValid = validator.IsValid(RequestWithKeyHeader(sentKey));

        Assert.False(isValid);
    }

    [Fact]
    public void IsValid_WithWhitespaceKeyConfiguredAndSent_ReturnsFalse()
    {
        var validator = ValidatorWithKey("   ");

        bool isValid = validator.IsValid(RequestWithKeyHeader("   "));

        Assert.False(isValid);
    }

    // An empty header counts as present, so the handler fails the request instead of treating it as one that sent no key.
    [Theory]
    [InlineData("")]
    [InlineData(ConfiguredKey)]
    public void HasKeyHeader_ForAHeaderThatIsPresent_ReturnsTrue(string sentKey)
    {
        var validator = ValidatorWithKey(ConfiguredKey);

        bool hasHeader = validator.HasKeyHeader(RequestWithKeyHeader(sentKey));

        Assert.True(hasHeader);
    }

    [Fact]
    public void HasKeyHeader_WithoutTheHeader_ReturnsFalse()
    {
        var validator = ValidatorWithKey(ConfiguredKey);

        bool hasHeader = validator.HasKeyHeader(RequestWithKeyHeader(null));

        Assert.False(hasHeader);
    }
}
