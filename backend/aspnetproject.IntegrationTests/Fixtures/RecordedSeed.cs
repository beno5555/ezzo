using Microsoft.Data.SqlClient;

namespace aspnetproject.IntegrationTests.Fixtures;

// The SQL that TestDataSeeder sent through EF, as one batch that inserts the same rows in one round trip.
public class RecordedSeed
{
    private readonly string                      _batch;
    private readonly IReadOnlyList<SqlParameter> _parameters;
    private readonly DateTime                    _recordingStartedAt;
    private readonly DateTime                    _recordingFinishedAt;

    public RecordedSeed(
        string                      batch,
        IReadOnlyList<SqlParameter> parameters,
        DateTime                    recordingStartedAt,
        DateTime                    recordingFinishedAt
        )
    {
        _batch               = batch;
        _parameters          = parameters;
        _recordingStartedAt  = recordingStartedAt;
        _recordingFinishedAt = recordingFinishedAt;
    }

    // Moves every time the seeder computed from DateTime.UtcNow forward by the time since the recording finished, as if
    // the seeder had just run: a "fresh" row stays fresh (inside the message edit window, say) however long the run has
    // lasted, and a time ahead of now stays as far ahead. Fixed past seed times lie before the recording and stay put;
    // so would UtcNow minus a window, which testing.md already rules out for the seeder.
    public Task ReplayAsync(SqlConnection connection) =>
        ReplayAsync(connection, DateTime.UtcNow - _recordingFinishedAt);

    // Inserts exactly the recorded values, for the fixture's check against the EF seed.
    public Task ReplayUnshiftedAsync(SqlConnection connection) => ReplayAsync(connection, TimeSpan.Zero);

    public static SqlParameter Copy(SqlParameter parameter) => (SqlParameter)((ICloneable)parameter).Clone();

    private async Task ReplayAsync(SqlConnection connection, TimeSpan seedClockShift)
    {
        await using var command = new SqlCommand(_batch, connection);

        foreach (SqlParameter recorded in _parameters)
        {
            var  parameter       = Copy(recorded);
            bool isSeedClockTime = parameter.Value is DateTime time && time >= _recordingStartedAt;

            if (isSeedClockTime)
            {
                parameter.Value = (DateTime)parameter.Value + seedClockShift;
            }

            command.Parameters.Add(parameter);
        }

        await command.ExecuteNonQueryAsync();
    }
}
