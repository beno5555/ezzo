using System.Text.Json.Serialization;
using aspnetproject.Common.ProjectConstants.Enums;

namespace aspnetproject.Common.Json;

// Reads decisions by name only, case-insensitively, like ReportTargetTypeJsonConverter: a number fails validation.
public class ReportDecisionJsonConverter : JsonStringEnumConverter<ReportDecision>
{
    public ReportDecisionJsonConverter() : base(namingPolicy: null, allowIntegerValues: false)
    {

    }
}
