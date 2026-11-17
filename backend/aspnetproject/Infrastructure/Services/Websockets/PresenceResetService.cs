using aspnetproject.Data.Models;
using aspnetproject.Data.Repositories;
using aspnetproject.Infrastructure.Dtos.DatabaseLogs;
using aspnetproject.Infrastructure.Services.Logging;

namespace aspnetproject.Infrastructure.Services.Websockets;

/// <summary>
/// Marks every user still marked online as offline, once, when the app starts. Hosted services start before the server
/// accepts requests, so no hub connection exists yet. UserConnectionTracker lives in memory, so after a restart nobody is
/// connected. A user still marked online was connected when the process stopped without a clean disconnect, and would
/// otherwise show as online to friends until they connected and left again. Assumes one backend instance.
/// </summary>
public class PresenceResetService : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory;

    public PresenceResetService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    // A failure here stops the host from starting: without its database the app cannot serve anything either.
    public Task StartAsync(CancellationToken cancellationToken) => ResetAsync(cancellationToken);

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    /// <summary>
    /// The reset itself. Public so a test can run it: the test host removes hosted services.
    /// </summary>
    public async Task ResetAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var userRepository = scope.ServiceProvider.GetRequiredService<UserRepository>();
        var dbLogger       = scope.ServiceProvider.GetRequiredService<DatabaseLogger>();

        int markedOffline = await userRepository.MarkEveryoneOfflineAsync(DateTime.UtcNow, cancellationToken);

        bool markedAny = markedOffline > 0;
        if (markedAny)
        {
            var log = new CreateLogDto
            {
                Succeeded  = true,
                Action     = $"{nameof(PresenceResetService)}.{nameof(ResetAsync)}",
                EntityName = nameof(User),
                EntityId   = null,
                Details    = $"Marked {markedOffline} users offline at startup",
            };
            await dbLogger.LogSystemActionAsync(log);
        }
    }
}
