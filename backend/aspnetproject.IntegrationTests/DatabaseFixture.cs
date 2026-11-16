using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Respawn;
using aspnetproject.Data;
using aspnetproject.IntegrationTests.Fixtures;

namespace aspnetproject.IntegrationTests;

public class DatabaseFixture : IAsyncLifetime
{
    // Set where Windows authentication is unavailable (scripts/test-linux.sh sets it); unset, the suite uses the local
    // default below. CustomWebApplicationFactory hands ConnectionString to the app under test, so both sides always agree.
    private const string ConnectionStringVariable    = "ConnectionStrings__DefaultConnection";
    private const string LocalConnectionStringFormat = "Server=localhost;Database={0};Trusted_Connection=True;TrustServerCertificate=True";
    private const string LocalDatabaseName           = "TestSocialMediaWebApiDb";
    private const string GitEntryName                = ".git";
    private const char   DatabaseNameSeparator       = '_';

    public static string ConnectionString { get; } =
        Environment.GetEnvironmentVariable(ConnectionStringVariable)
        ?? string.Format(LocalConnectionStringFormat, GetLocalDatabaseName());

    // A replay must reach the server in one request; the fixture checks it once per run.
    private const long   ExpectedReplayRoundTrips  = 1;
    private const string ServerRoundTripsStatistic = "ServerRoundtrips";
    private const string TableListSeparator        = ", ";

    // The wipe keeps it, and DatabaseSnapshot leaves it out.
    public const string MigrationsHistoryTable = "__EFMigrationsHistory";

    private Respawner _respawner = null!;
    private SqlConnection _connection = null!;
    private RecordedSeed _recordedSeed = null!;

    public async Task InitializeAsync()
    {
        var options = GetOptions();

        await using (var db = new ApplicationDbContext(options))
        {
            await db.Database.MigrateAsync();
        }

        _connection = new SqlConnection(ConnectionString);
        await _connection.OpenAsync();

        _respawner = await Respawner.CreateAsync(_connection, new RespawnerOptions
        {
            TablesToIgnore = new Respawn.Graph.Table[] { MigrationsHistoryTable },
            DbAdapter = DbAdapter.SqlServer
        });

        await RecordSeedAsync(options);
        await CheckReplayMatchesSeedAsync();
    }

    // Wipes every table, then replays the recorded seed in one round trip. The options are no longer used, but every
    // test class passes them.
    public async Task ResetAndSeedAsync(DbContextOptions<ApplicationDbContext> options)
    {
        await _respawner.ResetAsync(_connection);
        await _recordedSeed.ReplayAsync(_connection);
    }

    // The first seed of a run goes through EF and TestDataSeeder, and the SQL it sends is recorded for every later
    // reseed. The recording is taken fresh on every run, so a change to the seeder alone changes what the replay inserts.
    private async Task RecordSeedAsync(DbContextOptions<ApplicationDbContext> options)
    {
        await _respawner.ResetAsync(_connection);

        var recorder = new SeedRecorder();
        var recordingOptions = new DbContextOptionsBuilder<ApplicationDbContext>(options)
            .AddInterceptors(recorder)
            .Options;

        await using (var db = new ApplicationDbContext(recordingOptions))
        {
            await TestDataSeeder.SeedAsync(db);
        }

        _recordedSeed = recorder.Build();
    }

    // Proves once per run that a replay leaves every table as the EF seed left it, ids and identity values included,
    // and that it takes one round trip.
    private async Task CheckReplayMatchesSeedAsync()
    {
        var seeded = await DatabaseSnapshot.TakeAsync(_connection);

        await _respawner.ResetAsync(_connection);
        _connection.StatisticsEnabled = true;
        _connection.ResetStatistics();
        await _recordedSeed.ReplayUnshiftedAsync(_connection);
        long roundTrips = (long)_connection.RetrieveStatistics()[ServerRoundTripsStatistic]!;
        _connection.StatisticsEnabled = false;

        var  replayed         = await DatabaseSnapshot.TakeAsync(_connection);
        var  differences      = DatabaseSnapshot.FindDifferences(seeded, replayed);
        bool replayMatches    = differences.Count == 0;
        bool tookOneRoundTrip = roundTrips == ExpectedReplayRoundTrips;
        bool replayIsFaithful = replayMatches && tookOneRoundTrip;

        if (!replayIsFaithful)
        {
            throw new InvalidOperationException(
                $"The recorded seed does not replay the EF seed. Tables that differ: " +
                $"[{string.Join(TableListSeparator, differences)}]; round trips: {roundTrips}, expected {ExpectedReplayRoundTrips}.");
        }
    }

    public DbContextOptions<ApplicationDbContext> GetOptions() =>
        new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(ConnectionString)
            .Options;

    // A linked git worktree (claude --worktree) gets its own database named after its folder, so suites running in two
    // checkouts at once never wipe each other's data. The main checkout keeps the plain name.
    private static string GetLocalDatabaseName()
    {
        string databaseName = LocalDatabaseName;
        DirectoryInfo? checkoutRoot = FindCheckoutRoot();
        bool isLinkedWorktree = checkoutRoot is not null && File.Exists(Path.Combine(checkoutRoot.FullName, GitEntryName));

        if (isLinkedWorktree)
        {
            string suffix = new string(checkoutRoot!.Name
                .Select(character => char.IsAsciiLetterOrDigit(character) ? character : DatabaseNameSeparator)
                .ToArray());
            databaseName = $"{LocalDatabaseName}{DatabaseNameSeparator}{suffix}";
        }

        return databaseName;
    }

    // The nearest folder above the test binaries that holds a .git entry: a folder in the main checkout, a file in a linked worktree.
    private static DirectoryInfo? FindCheckoutRoot()
    {
        DirectoryInfo? directory = new DirectoryInfo(AppContext.BaseDirectory);
        bool found = false;

        while (directory is not null && !found)
        {
            found = Path.Exists(Path.Combine(directory.FullName, GitEntryName));
            if (!found)
            {
                directory = directory.Parent;
            }
        }

        return directory;
    }

    public async Task DisposeAsync()
    {
        await _connection.DisposeAsync();
    }
}
