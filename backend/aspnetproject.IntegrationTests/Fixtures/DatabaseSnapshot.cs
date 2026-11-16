using System.Globalization;
using Microsoft.Data.SqlClient;

namespace aspnetproject.IntegrationTests.Fixtures;

// Every row of every table the wipe empties, plus each table's current identity value, as sorted text per table.
// Two snapshots are equal when the tables hold the same rows and the next inserted row gets the same id.
public static class DatabaseSnapshot
{
    private const string ColumnSeparator   = "|";
    private const string NullValue         = "<null>";
    private const string IdentityLabel     = "identity: ";
    private const string IsoTimeFormat     = "O";
    private const int    SchemaColumn      = 0;
    private const int    TableColumn       = 1;

    private const string TablesQuery =
        "SELECT TABLE_SCHEMA, TABLE_NAME FROM INFORMATION_SCHEMA.TABLES " +
        "WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME <> '" + DatabaseFixture.MigrationsHistoryTable + "' " +
        "ORDER BY TABLE_SCHEMA, TABLE_NAME";

    private const string RowsQueryFormat     = "SELECT * FROM [{0}].[{1}]";
    private const string IdentityQueryFormat = "SELECT IDENT_CURRENT('[{0}].[{1}]')";

    public static async Task<IReadOnlyDictionary<string, string>> TakeAsync(SqlConnection connection)
    {
        var snapshot = new SortedDictionary<string, string>(StringComparer.Ordinal);

        foreach (var (schema, table) in await ReadTablesAsync(connection))
        {
            var lines = await ReadRowsAsync(connection, string.Format(RowsQueryFormat, schema, table));
            lines.Sort(StringComparer.Ordinal);

            await using var identityCommand = new SqlCommand(string.Format(IdentityQueryFormat, schema, table), connection);
            lines.Add(IdentityLabel + FormatValue(await identityCommand.ExecuteScalarAsync()));

            snapshot[$"{schema}.{table}"] = string.Join(Environment.NewLine, lines);
        }

        return snapshot;
    }

    // The names of the tables whose contents differ between two snapshots; empty when they match.
    public static IReadOnlyList<string> FindDifferences(
        IReadOnlyDictionary<string, string> expected, IReadOnlyDictionary<string, string> actual)
    {
        return expected.Keys.Union(actual.Keys)
            .Where(table => expected.GetValueOrDefault(table) != actual.GetValueOrDefault(table))
            .ToList();
    }

    private static async Task<List<(string Schema, string Table)>> ReadTablesAsync(SqlConnection connection)
    {
        var tables = new List<(string, string)>();

        await using var command = new SqlCommand(TablesQuery, connection);
        await using var reader  = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            tables.Add((reader.GetString(SchemaColumn), reader.GetString(TableColumn)));
        }

        return tables;
    }

    private static async Task<List<string>> ReadRowsAsync(SqlConnection connection, string query)
    {
        var rows = new List<string>();

        await using var command = new SqlCommand(query, connection);
        await using var reader  = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            var values = Enumerable.Range(0, reader.FieldCount)
                .Select(column => $"{reader.GetName(column)}={FormatValue(reader.GetValue(column))}");
            rows.Add(string.Join(ColumnSeparator, values));
        }

        return rows;
    }

    private static string FormatValue(object? value)
    {
        string formatted = value switch
        {
            null or DBNull      => NullValue,
            byte[] bytes        => Convert.ToHexString(bytes),
            DateTime time       => time.ToString(IsoTimeFormat, CultureInfo.InvariantCulture),
            IFormattable number => number.ToString(null, CultureInfo.InvariantCulture),
            _                   => value.ToString() ?? NullValue
        };

        return formatted;
    }
}
