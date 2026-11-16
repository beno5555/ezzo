using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.Data.Models;
using aspnetproject.Data.Repositories.Base;
using aspnetproject.Infrastructure.Queries;
using Microsoft.EntityFrameworkCore;

namespace aspnetproject.Data.Repositories;

public class ReportRepository : BaseEntityRepository<Report>
{
    public ReportRepository(ApplicationDbContext dbContext) : base(dbContext)
    {

    }

    public async Task<bool> HasPendingReportAsync(int reporterId, ReportTargetType targetType, int targetId)
    {
        return await ExistsAsync(report => report.ReporterUserId == reporterId
                                           && report.TargetType  == targetType
                                           && report.TargetId    == targetId
                                           && report.Status      == ReportStatus.Pending);
    }

    // Newest first. Id breaks ties between reports written in the same millisecond, so paging is deterministic.
    public async Task<List<Report>> GetReportsAsync(ReportListQuery reportQuery)
    {
        var query = Query(track: false)
            .Where(report => report.Status == reportQuery.Status);

        if (reportQuery.TargetType is not null)
        {
            query = query.Where(report => report.TargetType == reportQuery.TargetType);
        }

        var orderedQuery = query
            .OrderByDescending(report => report.CreatedAt)
            .ThenByDescending(report => report.Id);

        return await Page(orderedQuery, reportQuery.PageNumber, reportQuery.PageSize).ToListAsync();
    }

    // One conditional statement, so of two administrators deciding the same report at once, the second updates nothing:
    // its UPDATE waits on the first one's row lock, then finds the report no longer pending.
    public async Task<bool> DecideIfPendingAsync(int id, ReportStatus status, int reviewerId, DateTime reviewedAt)
    {
        int decidedCount = await _dbSet
            .Where(report => report.Id == id && report.Status == ReportStatus.Pending)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(report => report.Status, status)
                .SetProperty(report => report.ReviewedByUserId, reviewerId)
                .SetProperty(report => report.ReviewedAt, reviewedAt));

        return decidedCount > 0;
    }

    // Hiding decides for the whole target, so every other report on it still pending is resolved with the same reviewer
    // and time. The decided report is excluded: the caller claims it by key afterwards (see ReportService.HideAsync).
    public async Task ResolveOtherPendingForTargetAsync(int decidedReportId, ReportTargetType targetType, int targetId, int reviewerId, DateTime reviewedAt)
    {
        await _dbSet
            .Where(report => report.Id         != decidedReportId
                             && report.TargetType == targetType
                             && report.TargetId   == targetId
                             && report.Status     == ReportStatus.Pending)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(report => report.Status, ReportStatus.Resolved)
                .SetProperty(report => report.ReviewedByUserId, reviewerId)
                .SetProperty(report => report.ReviewedAt, reviewedAt));
    }

    // Filters ignored so a reporter or reviewer whose account is deactivated or soft-deleted still loads, and the mapper can name that state.
    protected override IQueryable<Report> Query(bool track = true)
    {
        var query = _dbSet
            .IgnoreQueryFilters()
            .Include(report => report.ReporterUser)
            .Include(report => report.ReviewedByUser);

        return track ? query : query.AsNoTracking();
    }
}
