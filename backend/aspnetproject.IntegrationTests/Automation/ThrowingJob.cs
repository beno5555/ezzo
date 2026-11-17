using aspnetproject.Infrastructure.Services.BackgroundJobs.Base;
using Microsoft.Extensions.DependencyInjection;

namespace aspnetproject.IntegrationTests.Automation;

// A background job whose every cycle throws, built by a test and run once through RunOnceAsync. Its interval never
// matters: no timer runs it.
public sealed class ThrowingJob : PeriodicHostedService
{
    public const string FailureMessage = "The job failed on purpose";

    public ThrowingJob(IServiceScopeFactory scopeFactory) : base(scopeFactory, TimeSpan.FromHours(1))
    {
    }

    protected override Task RunCycleAsync(IServiceProvider serviceProvider, CancellationToken stoppingToken)
    {
        throw new InvalidOperationException(FailureMessage);
    }
}
