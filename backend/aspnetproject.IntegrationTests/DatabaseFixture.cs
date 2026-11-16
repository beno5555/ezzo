using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using aspnetproject.Data;
using aspnetproject.IntegrationTests.Fixtures;

namespace aspnetproject.IntegrationTests;

// A test class's database: borrowed from the run's pool (TestDatabasePool) before the class's first test, and returned
// after its last. Every test class takes it as an IClassFixture, passes it to CustomWebApplicationFactory, and calls
// ResetAndSeedAsync before each test that relies on the seed. xUnit runs the classes at once, each on its own database.
public class DatabaseFixture : IAsyncLifetime
{
    private TestDatabasePool _pool        = null!;
    private PooledDatabase?  _database;
    private SqlConnection?   _connection;

    public string ConnectionString => Database.ConnectionString;

    public string DatabaseName => Database.Name;

    private PooledDatabase Database =>
        _database ?? throw new InvalidOperationException("The test class has not borrowed a database yet.");

    public async Task InitializeAsync()
    {
        _pool       = await TestDatabasePool.GetSharedAsync();
        _database   = await _pool.BorrowAsync();
        _connection = new SqlConnection(_database.ConnectionString);
        await _connection.OpenAsync();
    }

    // Wipes every table, then replays the recorded seed in one round trip.
    public async Task ResetAndSeedAsync()
    {
        CheckDatabaseIsOnLoanToThisClass();
        await Database.Respawner.ResetAsync(_connection!);
        await _pool.Seed.ReplayAsync(_connection!);
    }

    public DbContextOptions<ApplicationDbContext> GetOptions() =>
        new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(ConnectionString)
            .Options;

    // Before every reseed: the database is still on loan, so no other class can hold it (the lender never lends one twice),
    // and the connection that wipes it points at it.
    private void CheckDatabaseIsOnLoanToThisClass()
    {
        bool isOnLoan           = _pool.IsOnLoan(Database);
        bool connectsToBorrowed = _connection!.Database == Database.Name;
        bool belongsToThisClass = isOnLoan && connectsToBorrowed;

        if (!belongsToThisClass)
        {
            throw new InvalidOperationException(
                $"Test database {Database.Name} is not on loan to this test class; its connection points at {_connection.Database}.");
        }
    }

    public async Task DisposeAsync()
    {
        bool hasConnection = _connection is not null;
        if (hasConnection)
        {
            await _connection!.DisposeAsync();
        }

        bool hasBorrowed = _database is not null;
        if (hasBorrowed)
        {
            _pool.Return(_database!);
        }
    }
}
