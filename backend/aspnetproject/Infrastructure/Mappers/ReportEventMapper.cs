using aspnetproject.Data.Models;
using aspnetproject.Infrastructure.Dtos.Automation;

namespace aspnetproject.Infrastructure.Mappers;

public static class ReportEventMapper
{
    /// <summary>
    /// Pass the one target that matches the report's TargetType, loaded as the reports list loads it
    /// (see ReportService.GetReportsAsync). pendingReportTimes holds this report's time too.
    /// </summary>
    public static ReportCreatedEventDto ToCreatedEvent(
        Report         report,
        User?          reporter,
        Post?          post,
        Comment?       comment,
        User?          user,
        List<DateTime> pendingReportTimes
        )
    {
        return new ReportCreatedEventDto
        {
            ReportId           = report.Id,
            TargetType         = report.TargetType,
            TargetId           = report.TargetId,
            Reason             = report.Reason,
            ReporterId         = report.ReporterUserId,
            ReporterUsername   = UsernameMapper.ResolveUsername(reporter, report.ReporterUserId),
            Post               = post    is null ? null : SnapshotMapper.ToPostSnapshot(post),
            Comment            = comment is null ? null : SnapshotMapper.ToCommentSnapshot(comment),
            User               = user    is null ? null : SnapshotMapper.ToUserSnapshot(user),
            PendingReportTimes = pendingReportTimes
        };
    }
}
