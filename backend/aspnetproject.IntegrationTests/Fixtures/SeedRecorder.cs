using System.Data.Common;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace aspnetproject.IntegrationTests.Fixtures;

// Records every command EF sends while TestDataSeeder runs, and lets each one execute as usual. Build() joins them into
// one batch: each command's parameters are renamed apart, so the batch can carry all of them at once.
public partial class SeedRecorder : DbCommandInterceptor
{
    // SQL Server takes 2100 parameters per request, and sp_executesql, which carries a parameterised batch, uses two.
    private const int    MaxParametersPerBatch  = 2098;
    private const char   ParameterPrefix        = '@';
    private const int    ParameterNameGroup     = 1;
    private const string StatementTerminator    = ";";
    private const string RenamedParameterFormat = "@c{0}_{1}";
    private const string BatchOpening           = "SET XACT_ABORT ON;\nBEGIN TRANSACTION;\n";
    private const string BatchClosing           = "COMMIT TRANSACTION;\nSET XACT_ABORT OFF;\n";

    private readonly StringBuilder      _batch      = new(BatchOpening);
    private readonly List<SqlParameter> _parameters = [];
    private          int                _commandCount;

    // Set before the seeder runs: a seeded time at or after it was computed from DateTime.UtcNow.
    public DateTime RecordingStartedAt { get; } = DateTime.UtcNow;

    // Call once the seeder has finished.
    public RecordedSeed Build()
    {
        RecordedSeed recordedSeed;
        bool fitsInOneBatch = _parameters.Count <= MaxParametersPerBatch;

        if (fitsInOneBatch)
        {
            recordedSeed = new RecordedSeed(_batch + BatchClosing, _parameters, RecordingStartedAt, DateTime.UtcNow);
        }
        else
        {
            throw new InvalidOperationException(
                $"The recorded seed needs {_parameters.Count} parameters; one batch holds at most {MaxParametersPerBatch}.");
        }

        return recordedSeed;
    }

    public override InterceptionResult<DbDataReader> ReaderExecuting(
        DbCommand command, CommandEventData eventData, InterceptionResult<DbDataReader> result)
    {
        Record(command);
        return base.ReaderExecuting(command, eventData, result);
    }

    public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
        DbCommand                         command,
        CommandEventData                  eventData,
        InterceptionResult<DbDataReader>  result,
        CancellationToken                 cancellationToken = default
        )
    {
        Record(command);
        return base.ReaderExecutingAsync(command, eventData, result, cancellationToken);
    }

    public override InterceptionResult<int> NonQueryExecuting(
        DbCommand command, CommandEventData eventData, InterceptionResult<int> result)
    {
        Record(command);
        return base.NonQueryExecuting(command, eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> NonQueryExecutingAsync(
        DbCommand               command,
        CommandEventData        eventData,
        InterceptionResult<int> result,
        CancellationToken       cancellationToken = default
        )
    {
        Record(command);
        return base.NonQueryExecutingAsync(command, eventData, result, cancellationToken);
    }

    public override InterceptionResult<object> ScalarExecuting(
        DbCommand command, CommandEventData eventData, InterceptionResult<object> result)
    {
        Record(command);
        return base.ScalarExecuting(command, eventData, result);
    }

    public override ValueTask<InterceptionResult<object>> ScalarExecutingAsync(
        DbCommand                  command,
        CommandEventData           eventData,
        InterceptionResult<object> result,
        CancellationToken          cancellationToken = default
        )
    {
        Record(command);
        return base.ScalarExecutingAsync(command, eventData, result, cancellationToken);
    }

    private void Record(DbCommand command)
    {
        int commandIndex = _commandCount++;
        var renamedParameters = new Dictionary<string, string>();

        foreach (SqlParameter parameter in command.Parameters)
        {
            string name    = parameter.ParameterName.TrimStart(ParameterPrefix);
            string renamed = string.Format(RenamedParameterFormat, commandIndex, name);
            var    copy    = RecordedSeed.Copy(parameter);

            copy.ParameterName      = renamed;
            renamedParameters[name] = renamed;
            _parameters.Add(copy);
        }

        string commandText = ParameterReference().Replace(command.CommandText, match =>
            renamedParameters.GetValueOrDefault(match.Groups[ParameterNameGroup].Value, match.Value));
        bool isTerminated = commandText.TrimEnd().EndsWith(StatementTerminator);

        _batch.AppendLine(isTerminated ? commandText : commandText + StatementTerminator);
    }

    // "@name", but not the "@@" of a system function such as @@ROWCOUNT.
    [GeneratedRegex(@"(?<!@)@(\w+)")]
    private static partial Regex ParameterReference();
}
