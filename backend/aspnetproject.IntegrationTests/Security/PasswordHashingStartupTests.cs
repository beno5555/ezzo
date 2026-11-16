using aspnetproject.Infrastructure.Services.Helpers.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace aspnetproject.IntegrationTests.Security;

// The test host forces PasswordConfiguration:HashIterations to 1 only in Testing. In any other environment a value below
// 100,000 must stop the app at startup. These tests never touch the database, so no reseed is needed.
[Collection("Database")]
public class PasswordHashingStartupTests
{
    [Theory]
    [InlineData(CustomWebApplicationFactory.DevelopmentEnvironment, "99999")]
    [InlineData(CustomWebApplicationFactory.DevelopmentEnvironment, "1")]
    [InlineData(CustomWebApplicationFactory.ProductionEnvironment, "99999")]
    [InlineData(CustomWebApplicationFactory.ProductionEnvironment, "0")]
    public async Task Startup_OutsideTestingWithIterationsBelowFloor_FailsNamingTheSetting(string environmentName, string iterations)
    {
        await using var factory = new CustomWebApplicationFactory(
            new Dictionary<string, string?> { [CustomWebApplicationFactory.HashIterationsSetting] = iterations },
            environmentName);

        var exception = Record.Exception(() => factory.CreateClient());

        var validationException = Assert.IsType<OptionsValidationException>(exception);
        Assert.Contains(CustomWebApplicationFactory.HashIterationsSetting, validationException.Message);
    }

    [Fact]
    public async Task Startup_OutsideTestingWithoutTheSetting_BindsOneHundredThousandIterations()
    {
        await using var factory = new CustomWebApplicationFactory(environmentName: CustomWebApplicationFactory.DevelopmentEnvironment);

        var configuration = factory.Services.GetRequiredService<IOptions<PasswordHashingConfiguration>>().Value;

        Assert.Equal(CustomWebApplicationFactory.ProductionHashIterations, configuration.HashIterations);
    }

    [Fact]
    public async Task Startup_InTesting_BindsTheTestHostsIterations()
    {
        await using var factory = new CustomWebApplicationFactory();

        var configuration = factory.Services.GetRequiredService<IOptions<PasswordHashingConfiguration>>().Value;

        Assert.Equal(CustomWebApplicationFactory.TestHashIterations, configuration.HashIterations);
    }
}
