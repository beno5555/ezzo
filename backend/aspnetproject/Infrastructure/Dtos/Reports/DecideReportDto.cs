using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using aspnetproject.Common.Json;
using aspnetproject.Common.ProjectConstants.Enums;

namespace aspnetproject.Infrastructure.Dtos.Reports;

// Decision names only, read case-insensitively (ReportDecisionJsonConverter). Nullable so that a missing decision fails
// validation instead of binding to 0.
public class DecideReportDto
{
    [Required]
    [EnumDataType(typeof(ReportDecision))]
    [JsonConverter(typeof(ReportDecisionJsonConverter))]
    public ReportDecision? Decision { get; set; }
}
