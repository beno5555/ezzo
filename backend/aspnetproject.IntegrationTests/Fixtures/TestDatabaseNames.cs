using Microsoft.Data.SqlClient;

namespace aspnetproject.IntegrationTests.Fixtures;

// Where the run's test databases are. Each checkout has a base test database name, and its pool is that name numbered
// from 1: TestSocialMediaWebApiDb_1 to _4 in the main checkout, TestSocialMediaWebApiDb_<worktree>_1 to _4 in a worktree.
// Because every pool name ends in a single digit, two checkouts with different base names never share a database.
public static class TestDatabaseNames
{
    // Set where Windows authentication is unavailable (scripts/test-linux.sh sets it); its database is the base name.
    // Unset, the suite uses the local default below.
    private const string ConnectionStringVariable    = "ConnectionStrings__DefaultConnection";
    private const string LocalConnectionStringFormat = "Server=localhost;Database={0};Trusted_Connection=True;TrustServerCertificate=True";
    private const string LocalDatabaseName           = "TestSocialMediaWebApiDb";
    private const string GitEntryName                = ".git";
    private const char   DatabaseNameSeparator       = '_';
    private const int    FirstPoolNumber             = 1;

    // xUnit runs at most this many test classes at once (AssemblyInfo.cs), and the pool never holds more databases.
    public const int MaxPoolSize = 4;

    public static int PoolSize { get; } = Math.Min(MaxPoolSize, Environment.ProcessorCount);

    // The pool's connection strings: the base connection string with each pool database in place of the base one.
    public static IReadOnlyList<string> PoolConnectionStrings { get; } = GetPoolConnectionStrings();

    public static IReadOnlyList<string> ForPool(string baseDatabaseName, int poolSize) =>
        Enumerable.Range(FirstPoolNumber, poolSize)
            .Select(number => $"{baseDatabaseName}{DatabaseNameSeparator}{number}")
            .ToList();

    private static IReadOnlyList<string> GetPoolConnectionStrings()
    {
        string baseConnectionString =
            Environment.GetEnvironmentVariable(ConnectionStringVariable)
            ?? string.Format(LocalConnectionStringFormat, GetLocalDatabaseName());
        var builder = new SqlConnectionStringBuilder(baseConnectionString);

        return ForPool(builder.InitialCatalog, PoolSize)
            .Select(databaseName => new SqlConnectionStringBuilder(baseConnectionString) { InitialCatalog = databaseName }.ConnectionString)
            .ToList();
    }

    // A linked git worktree (claude --worktree) gets a base name with its folder's name in it, so suites running in two
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
}
