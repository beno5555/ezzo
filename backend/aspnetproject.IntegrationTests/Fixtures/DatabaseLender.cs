using System.Threading.Channels;

namespace aspnetproject.IntegrationTests.Fixtures;

// Lends the pool's databases to the test classes that run at the same time, one class per database. A borrower waits
// while every database is on loan. The lender also keeps the list of databases on loan and refuses to lend one twice or
// take one back that is not out, so no two classes can ever share a database, even through a fixture bug.
public class DatabaseLender
{
    private readonly Channel<string> _available = Channel.CreateUnbounded<string>();
    private readonly HashSet<string> _onLoan    = [];
    private readonly Lock            _ledgerLock = new();

    public DatabaseLender(IReadOnlyList<string> databaseNames)
    {
        foreach (string databaseName in databaseNames)
        {
            _available.Writer.TryWrite(databaseName);
        }
    }

    public async Task<string> BorrowAsync()
    {
        string databaseName = await _available.Reader.ReadAsync();
        bool wasAvailable;

        lock (_ledgerLock)
        {
            wasAvailable = _onLoan.Add(databaseName);
        }

        if (!wasAvailable)
        {
            throw new InvalidOperationException($"Test database {databaseName} was lent while already on loan.");
        }

        return databaseName;
    }

    public void Return(string databaseName)
    {
        bool wasOnLoan;

        lock (_ledgerLock)
        {
            wasOnLoan = _onLoan.Remove(databaseName);
        }

        if (wasOnLoan)
        {
            _available.Writer.TryWrite(databaseName);
        }
        else
        {
            throw new InvalidOperationException($"Test database {databaseName} was returned but is not on loan.");
        }
    }

    public bool IsOnLoan(string databaseName)
    {
        bool isOnLoan;

        lock (_ledgerLock)
        {
            isOnLoan = _onLoan.Contains(databaseName);
        }

        return isOnLoan;
    }
}
