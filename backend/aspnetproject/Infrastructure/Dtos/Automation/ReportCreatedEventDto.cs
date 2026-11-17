using System.Text.Json.Serialization;
using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.Infrastructure.Dtos.Moderation;
using aspnetproject.Infrastructure.Dtos.Reports;

namespace aspnetproject.Infrastructure.Dtos.Automation;

// The data of report-created. At most one snapshot is set, the one matching TargetType, as in the reports list.
public class ReportCreatedEventDto
{
    public int ReportId { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter<ReportTargetType>))]
    public ReportTargetType TargetType { get; set; }
    public int              TargetId   { get; set; }

    public string Reason { get; set; } = string.Empty;

    public int    ReporterId       { get; set; }
    public string ReporterUsername { get; set; } = string.Empty;

    public PostSnapshotDto?    Post    { get; set; }
    public CommentSnapshotDto? Comment { get; set; }
    public UserSnapshotDto?    User    { get; set; }

    // The creation times of every pending report on the same target, this one included, oldest first. A decided report is not among them.
    public List<DateTime> PendingReportTimes { get; set; } = [];
}
