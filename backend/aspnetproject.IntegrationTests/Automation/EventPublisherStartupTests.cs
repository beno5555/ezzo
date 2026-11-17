using Microsoft.Extensions.Options;

namespace aspnetproject.IntegrationTests.Automation;

// With events on, the app refuses to start without the address or the secret it needs to send them. These tests never
// touch the data, so no reseed is needed; the hosts still get the class's own database.
public class EventPublisherStartupTests : IClassFixture<DatabaseFixture>
{
    private readonly DatabaseFixture _dbFixture;

    public EventPublisherStartupTests(DatabaseFixture dbFixture)
    {
        _dbFixture = dbFixture;
    }

    [Theory]
    [InlineData(CustomWebApplicationFactory.EventsBaseUrlSetting, "")]
    [InlineData(CustomWebApplicationFactory.EventsBaseUrlSetting, "   ")]
    [InlineData(CustomWebApplicationFactory.EventsBaseUrlSetting, null)]
    [InlineData(CustomWebApplicationFactory.EventsSigningSecretSetting, "")]
    [InlineData(CustomWebApplicationFactory.EventsSigningSecretSetting, null)]
    [InlineData(CustomWebApplicationFactory.EventsTimeoutSetting, "00:00:00")]
    [InlineData(CustomWebApplicationFactory.EventsTimeoutSetting, "-00:00:01")]
    public async Task Startup_WithEventsOnAndSettingMissingOrInvalid_FailsNamingTheSetting(string setting, string? value)
    {
        await using var factory = new CustomWebApplicationFactory(
            _dbFixture,
            new Dictionary<string, string?> { [setting] = value },
            recordEvents: true);

        var exception = Record.Exception(() => factory.CreateClient());

        var validationException = Assert.IsType<OptionsValidationException>(exception);
        Assert.Contains(setting, validationException.Message);
    }

    [Fact]
    public async Task Startup_WithEventsOffAndNoAddressOrSecret_Starts()
    {
        await using var factory = new CustomWebApplicationFactory(_dbFixture, new Dictionary<string, string?>
        {
            [CustomWebApplicationFactory.EventsBaseUrlSetting]       = null,
            [CustomWebApplicationFactory.EventsSigningSecretSetting] = null
        });

        var exception = Record.Exception(() => factory.CreateClient());

        Assert.Null(exception);
    }
}
