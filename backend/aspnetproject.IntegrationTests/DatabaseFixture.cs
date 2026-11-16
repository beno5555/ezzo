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
        CheckDatabaseIsStillOnLoan();
        await Database.Respawner.ResetAsync(_connection!);
        await _pool.Seed.ReplayAsync(_connection!);
    }

    public DbContextOptions<ApplicationDbContext> GetOptions() =>
        new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(ConnectionString)
            .Options;

    // Before every reseed: the database is still on loan, and the connection that wipes it points at it. That no other
    // class holds it too is the lender's guarantee: it never lends a database that is on loan (DatabaseLenderTests).
    private void CheckDatabaseIsStillOnLoan()
    {
        bool isOnLoan           = _pool.IsOnLoan(Database);
        bool connectsToBorrowed = _connection!.Database == Database.Name;
        bool canReseed          = isOnLoan && connectsToBorrowed;

        if (!canReseed)
        {
            throw new InvalidOperationException(
                $"Test database {Database.Name} is no longer on loan, or its connection points at {_connection.Database}.");
        }
    }

    // The database goes back even if closing the connection fails, or the pool would shrink for the rest of the run.
    public async Task DisposeAsync()
    {
        try
        {
            bool hasConnection = _connection is not null;
            if (hasConnection)
            {
                await _connection!.DisposeAsync();
            }
        }
        finally
        {
            bool hasBorrowed = _database is not null;
            if (hasBorrowed)
            {
                _pool.Return(_database!);
            }
        }
    }
}
