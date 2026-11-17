using aspnetproject.Common.ProjectConstants;
using aspnetproject.Infrastructure.Dtos.DatabaseLogs;
using aspnetproject.Infrastructure.Mappers;
using aspnetproject.Infrastructure.Services.Automation;
using aspnetproject.Infrastructure.Services.Logging;

namespace aspnetproject.Infrastructure.Services.BackgroundJobs.Base;

public abstract class PeriodicHostedService : BackgroundService
{
    private readonly string _serviceName;
    
    private readonly TimeSpan             _interval;
    private readonly IServiceScopeFactory _scopeFactory;

    protected PeriodicHostedService(IServiceScopeFactory scopeFactory, TimeSpan interval)
    {
        _serviceName = GetType().Name;
        
        _interval = interval;
        _scopeFactory = scopeFactory;
    }
    
    
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(_interval);

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await RunOnceAsync(stoppingToken);
        }
    }

    /// <summary>
    /// Runs one cycle in its own scope, as each timer tick does; a failed cycle is logged and sent as an exception-occurred
    /// event, not thrown. Public so a test can run a cycle without the timer. The test host removes hosted services, so a
    /// job under test is also registered as a singleton (see docs/backend/background-jobs.md).
    /// </summary>
    public async Task RunOnceAsync(CancellationToken stoppingToken)
    {
        using var scope = _scopeFactory.CreateScope();

        var dbLogger = scope.ServiceProvider.GetRequiredService<DatabaseLogger>();

        try
        {
            await RunCycleAsync(scope.ServiceProvider, stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            //
        }
        catch (Exception ex)
        {
            await LogResultAsync(dbLogger, false, null, ex.Message);

            var eventPublisher = scope.ServiceProvider.GetRequiredService<EventPublisher>();
            await eventPublisher.PublishAsync(EventNames.ExceptionOccurred, ExceptionEventMapper.ToJobEvent(ex, _serviceName));
        }
    }

    protected abstract Task RunCycleAsync(IServiceProvider serviceProvider, CancellationToken stoppingToken);
    
    protected async Task LogResultAsync(
        DatabaseLogger dbLogger,
        bool           succeeded,
        string?        entityName,
        string?        details
        )
    {
        var log = new CreateLogDto
        {
            Succeeded = succeeded,
            Action = $"{_serviceName}.{nameof(RunCycleAsync)}",
            
            EntityName = entityName,
            EntityId = null,
            
            Details = LogDetails.FitToColumn(details),
        };

        await dbLogger.LogSystemActionAsync(log);
    }
}