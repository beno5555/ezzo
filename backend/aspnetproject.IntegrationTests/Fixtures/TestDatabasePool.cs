using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Respawn;
using aspnetproject.Data;

namespace aspnetproject.IntegrationTests.Fixtures;

// The run's test databases (TestDatabaseNames), prepared once: the first test class to start migrates every database and
// records the seed, and every class starting at the same time waits for that same preparation. xUnit 2 has no fixture
// shared by the whole assembly, so the pool is a static, built on first use and kept until the run ends.
public class TestDatabasePool
{
    // The wipe keeps it, and DatabaseSnapshot leaves it out.
    public const string MigrationsHistoryTable = "__EFMigrationsHistory";

    // A replay must reach the server in one request; the pool checks it once per run.
    private const long   ExpectedReplayRoundTrips  = 1;
    private const string ServerRoundTripsStatistic = "ServerRoundtrips";
    private const string TableListSeparator        = ", ";

    private static readonly Lazy<Task<TestDatabasePool>> SharedPool =
        new(() => PrepareAsync(TestDatabaseNames.PoolConnectionStrings));

    private readonly IReadOnlyDictionary<string, PooledDatabase> _databases;
    private readonly DatabaseLender                              _lender;

    private TestDatabasePool(IReadOnlyList<PooledDatabase> databases, RecordedSeed seed)
    {
        _databases = databases.ToDictionary(database => database.Name);
        _lender    = new DatabaseLender(databases.Select(database => database.Name).ToList());
        Seed       = seed;
    }

    // Recorded from the first database, and replayed into any of them.
    public RecordedSeed Seed { get; }

    public static Task<TestDatabasePool> GetSharedAsync() => SharedPool.Value;

    // Waits while every database is lent to another test class.
    public async Task<PooledDatabase> BorrowAsync()
    {
        string databaseName = await _lender.BorrowAsync();
        return _databases[databaseName];
    }

    public void Return(PooledDatabase database) => _lender.Return(database.Name);

    public bool IsOnLoan(PooledDatabase database) => _lender.IsOnLoan(database.Name);

    // The databases are migrated one after another: SQL Server copies its model database to create one, and two
    // creations at once can fail on the lock that copy takes.
    private static async Task<TestDatabasePool> PrepareAsync(IReadOnlyList<string> connectionStrings)
    {
        var databases = new List<PooledDatabase>();

        foreach (string connectionString in connectionStrings)
        {
            databases.Add(await MigrateAsync(connectionString));
        }

        RecordedSeed seed = await RecordSeedAsync(databases[0]);
        return new TestDatabasePool(databases, seed);
    }

    private static async Task<PooledDatabase> MigrateAsync(string connectionString)
    {
        await using (var db = new ApplicationDbContext(GetOptions(connectionString)))
        {
            await db.Database.MigrateAsync();
        }

        await using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        var respawner = await Respawner.CreateAsync(connection, new RespawnerOptions
        {
            TablesToIgnore = new Respawn.Graph.Table[] { MigrationsHistoryTable },
            DbAdapter = DbAdapter.SqlServer
        });

        return new PooledDatabase(connection.Database, connectionString, respawner);
    }

    // The first seed of a run goes through EF and TestDataSeeder, and the SQL it sends is recorded for every later
    // reseed. The recording is taken fresh on every run, so a change to the seeder alone changes what the replay inserts.
    private static async Task<RecordedSeed> RecordSeedAsync(PooledDatabase database)
    {
        await using var connection = new SqlConnection(database.ConnectionString);
        await connection.OpenAsync();
        await database.Respawner.ResetAsync(connection);

        var recorder = new SeedRecorder();
        var recordingOptions = new DbContextOptionsBuilder<ApplicationDbContext>(GetOptions(database.ConnectionString))
            .AddInterceptors(recorder)
            .Options;

        await using (var db = new ApplicationDbContext(recordingOptions))
        {
            await TestDataSeeder.SeedAsync(db);
        }

        var recordedSeed = recorder.Build();
        await CheckReplayMatchesSeedAsync(database, connection, recordedSeed);

        return recordedSeed;
    }

    // Proves once per run that a replay leaves every table as the EF seed left it, ids and identity values included,
    // and that it takes one round trip.
    private static async Task CheckReplayMatchesSeedAsync(PooledDatabase database, SqlConnection connection, RecordedSeed recordedSeed)
    {
        var seeded = await DatabaseSnapshot.TakeAsync(connection);

        await database.Respawner.ResetAsync(connection);
        connection.StatisticsEnabled = true;
        connection.ResetStatistics();
        await recordedSeed.ReplayUnshiftedAsync(connection);
        long roundTrips = (long)connection.RetrieveStatistics()[ServerRoundTripsStatistic]!;
        connection.StatisticsEnabled = false;

        var  replayed         = await DatabaseSnapshot.TakeAsync(connection);
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

    private static DbContextOptions<ApplicationDbContext> GetOptions(string connectionString) =>
        new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(connectionString)
            .Options;
}
