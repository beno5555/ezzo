using aspnetproject.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace aspnetproject.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    // Replaces the first entry of Cors:AllowedOrigins, so tests that need a trusted origin do not depend on the settings file.
    public const string TrustedFrontendOrigin = "http://frontend.webcity.test:4200";

    // The host's own switch for reloadOnChange on the default appsettings*.json sources. Those sources are built before
    // ConfigureAppConfiguration runs, so flipping ReloadOnChange on them there has no effect. Each file watcher holds an inotify
    // instance, and Linux caps them per user (128 in the cloud container).
    private const string ReloadConfigOnChangeSetting = "hostBuilder:reloadConfigOnChange";
    private const string DisabledSettingValue        = "false";

    private const string ConnectionStringSetting  = "ConnectionStrings:DefaultConnection";
    private const string UploadFolderSetting      = "ImageStorage:UploadFolder";
    private const string TestUploadFolderRootName = "webcity-test-uploads";
    public const string HashIterationsSetting     = "PasswordConfiguration:HashIterations";

    // A sign-in at the production 100,000 rounds costs 60 to 80 ms. The app accepts a lower value only in Testing, so hosts in
    // other environments keep the default, and TestDataSeeder's users can sign in only on Testing hosts.
    public const int TestHashIterations = 1;

    // What every other environment hashes with, pinned as a literal so tests catch a changed default.
    public const int ProductionHashIterations = 100_000;

    public const string TestingEnvironment     = "Testing";
    public const string DevelopmentEnvironment = "Development";
    public const string ProductionEnvironment  = "Production";

    private readonly string _connectionString;
    private readonly IReadOnlyDictionary<string, string?> _settingOverrides;
    private readonly string _environmentName;

    // Each host stores uploads in its own temporary folder, removed when the host is disposed.
    public string UploadFolder { get; } =
        Path.Combine(Path.GetTempPath(), TestUploadFolderRootName, Guid.NewGuid().ToString("N"));

    // database is the test class's DatabaseFixture: the host uses the database the class borrowed from the pool.
    // settingOverrides win over the settings file and the suite's defaults, e.g. a lower ImageStorage:MaxFileSizeBytes.
    // environmentName is Testing unless a test needs a Development-only feature, such as the OpenAPI document.
    public CustomWebApplicationFactory(
        DatabaseFixture                       database,
        IReadOnlyDictionary<string, string?>? settingOverrides = null,
        string                                environmentName  = TestingEnvironment
        )
    {
        _connectionString = database.ConnectionString;
        _settingOverrides = settingOverrides ?? new Dictionary<string, string?>();
        _environmentName  = environmentName;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment(_environmentName);
        builder.UseSetting(ReloadConfigOnChangeSetting, DisabledSettingValue);

        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddJsonFile("appsettings.Testing.json", optional: false);

            // Added after the settings file so it wins: the suite never sends real email, always trusts TrustedFrontendOrigin,
            // and always uses the database its test class borrowed and reseeds. A Testing host also hashes passwords with
            // TestHashIterations, the count TestDataSeeder hashes its users' password with.
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                [ConnectionStringSetting] = _connectionString,
                ["EmailConfiguration:Enabled"] = "false",
                ["Cors:AllowedOrigins:0"] = TrustedFrontendOrigin,
                [UploadFolderSetting] = UploadFolder
            });

            bool isTestingHost = _environmentName == TestingEnvironment;
            if (isTestingHost)
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    [HashIterationsSetting] = TestHashIterations.ToString()
                });
            }

            config.AddInMemoryCollection(_settingOverrides);
        });

        builder.ConfigureServices(services =>
        {
            var hostedServices = services
                .Where(s => s.ServiceType == typeof(IHostedService))
                .ToList();

            foreach (var serviceDescriptor in hostedServices)
            {
                services.Remove(serviceDescriptor);
            }
        });
    }

    public override async ValueTask DisposeAsync()
    {
        await base.DisposeAsync();
        DeleteUploadFolder();
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        DeleteUploadFolder();
    }

    private void DeleteUploadFolder()
    {
        bool folderExists = Directory.Exists(UploadFolder);
        if (folderExists)
        {
            Directory.Delete(UploadFolder, recursive: true);
        }
    }
}
