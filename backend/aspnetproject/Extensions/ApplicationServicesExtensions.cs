using aspnetproject.Data.Repositories;
using aspnetproject.Infrastructure.Services.Automation;
using aspnetproject.Infrastructure.Services.Automation.Configuration;
using aspnetproject.Infrastructure.Dtos.Auth.Email;
using aspnetproject.Infrastructure.Services.BackgroundJobs;
using aspnetproject.Infrastructure.Services.BackgroundJobs.Configuration;
using aspnetproject.Infrastructure.Services.BusinessLogic;
using aspnetproject.Infrastructure.Services.BusinessLogic.Content;
using aspnetproject.Infrastructure.Services.BusinessLogic.Users;
using aspnetproject.Infrastructure.Services.Helpers;
using aspnetproject.Infrastructure.Services.Helpers.Configuration;
using aspnetproject.Infrastructure.Services.Logging;
using aspnetproject.Infrastructure.Services.Storage;
using aspnetproject.Infrastructure.Services.Storage.Configuration;
using aspnetproject.Infrastructure.Services.Websockets;

namespace aspnetproject.Extensions;

public static class ApplicationServicesExtensions
{
    public static void AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSignalR().AddUtcTimeJson();
        services.AddSingleton<UserConnectionTracker>();
        
        services.AddScoped<CommentRepository>();
        services.AddScoped<FriendshipRepository>();
        services.AddScoped<MessageRepository>();
        services.AddScoped<PostRepository>();
        services.AddScoped<PostLikeRepository>();
        services.AddScoped<UserRepository>();
        services.AddScoped<RoleRepository>();
        services.AddScoped<UserRoleRepository>();
        services.AddScoped<RefreshTokenRepository>();
        services.AddScoped<LogRepository>();
        services.AddScoped<ImageRepository>();
        services.AddScoped<ReportRepository>();

        services.AddScoped<UserService>();
        services.AddScoped<AuthService>();
        services.AddScoped<AccountManagementService>();
        services.AddScoped<AccountActivationService>();
        services.AddScoped<AccountSecurityService>();
        services.AddScoped<CommentService>();
        services.AddScoped<FriendshipService>();
        services.AddScoped<MessageService>();
        services.AddScoped<ModerationService>();
        services.AddScoped<PostService>();
        services.AddScoped<PostLikeService>();
        services.AddScoped<ReportService>();
        services.AddScoped<PresenceService>();
        services.AddScoped<TypingService>();
        services.AddScoped<LogService>();
        services.AddScoped<StatisticsService>();

        services.AddScoped<PasswordHasher>();
        services.AddScoped<TokenGenerator>();
        services.AddScoped<UrlSecurityService>();
        services.AddScoped<ImageStorage>();

        services.AddScoped<SystemLogger>();
        services.AddScoped<DatabaseLogger>();

        services.Configure<EmailConfiguration>(configuration.GetSection("EmailConfiguration"));
        services.AddTransient<EmailSender>();
        
        services.AddOptions<PasswordHashingConfiguration>()
            .Bind(configuration.GetSection("PasswordConfiguration"))
            .Validate<IHostEnvironment>(
                (config, environment) => config.HasSafeIterationsFor(environment),
                PasswordHashingConfiguration.IterationsTooLowMessage)
            .ValidateOnStart();

        services.Configure<ImageStorageConfiguration>(configuration.GetSection("ImageStorage"));

        services.AddOptions<AutomationEventsConfiguration>()
            .Bind(configuration.GetSection(AutomationEventsConfiguration.SectionName))
            .Validate(config => config.HasBaseUrlIfEnabled(), AutomationEventsConfiguration.BaseUrlMissingMessage)
            .Validate(config => config.HasSigningSecretIfEnabled(), AutomationEventsConfiguration.SigningSecretMissingMessage)
            .Validate(config => config.HasPositiveTimeout(), AutomationEventsConfiguration.TimeoutNotPositiveMessage)
            .ValidateOnStart();
        // A typed client: the test host swaps its HTTP handler for a recorder.
        services.AddHttpClient<EventPublisher>();

        services.Configure<OldLogsCleanupConfiguration>(configuration.GetSection("CleanupConfiguration:OldLogs"));
        services.Configure<RefreshTokenCleanupConfiguration>(configuration.GetSection("CleanupConfiguration:RefreshTokens"));
        services.Configure<SoftDeletedUsersCleanupConfiguration>(configuration.GetSection("CleanupConfiguration:SoftDeletedUsers"));
        services.AddOptions<OrphanImagesCleanupConfiguration>()
            .Bind(configuration.GetSection("CleanupConfiguration:OrphanImages"))
            .Validate(config => config.HasSafeMinimumAge(), OrphanImagesCleanupConfiguration.MinimumAgeTooShortMessage)
            .ValidateOnStart();

        services.AddHostedService<RefreshTokenCleanupService>();
        services.AddHostedService<OldLogsCleanupService>();

        // Also singletons, so integration tests can run one sweep: their host removes every IHostedService.
        services.AddSingleton<SoftDeletedUsersCleanupService>();
        services.AddHostedService(serviceProvider => serviceProvider.GetRequiredService<SoftDeletedUsersCleanupService>());
        services.AddSingleton<OrphanImagesCleanupService>();
        services.AddHostedService(serviceProvider => serviceProvider.GetRequiredService<OrphanImagesCleanupService>());
    }
}