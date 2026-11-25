using aspnetproject.Data;
using aspnetproject.Data.Seed;
using aspnetproject.Infrastructure.Services.Helpers;
using aspnetproject.Infrastructure.Services.Storage;

namespace aspnetproject.Extensions;

// `dotnet run --project backend/aspnetproject -- seed-demo` empties the database, seeds the demo data and exits
// instead of serving requests. See DemoDataSeeder for what it writes.
public static class DemoSeedExtensions
{
    private const string NotDevelopmentMessage = "The demo seed empties the database, so it runs only in the Development environment.";

    public static bool IsDemoSeedRequested(this string[] args)
    {
        return args.Contains(DemoDataSeeder.CommandLineArgument);
    }

    public static void SeedDemoData(this WebApplication app)
    {
        if (!app.Environment.IsDevelopment())
        {
            throw new InvalidOperationException(NotDevelopmentMessage);
        }

        using var scope = app.Services.CreateScope();
        var seeder = new DemoDataSeeder(
            scope.ServiceProvider.GetRequiredService<ApplicationDbContext>(),
            scope.ServiceProvider.GetRequiredService<PasswordHasher>(),
            scope.ServiceProvider.GetRequiredService<ImageStorage>());

        var summary = seeder.SeedAsync().GetAwaiter().GetResult();
        app.Logger.LogInformation("Demo data seeded: {Summary}", summary);
    }
}
