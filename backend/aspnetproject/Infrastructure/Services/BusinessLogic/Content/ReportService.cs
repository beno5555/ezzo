using aspnetproject.Common.Domain;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.Data.Models;
using aspnetproject.Data.Repositories;
using aspnetproject.Infrastructure.Dtos.Reports;
using aspnetproject.Infrastructure.Mappers;
using aspnetproject.Infrastructure.Queries;
using aspnetproject.Infrastructure.Services.Automation;
using aspnetproject.Infrastructure.Services.BusinessLogic.Base;
using aspnetproject.Infrastructure.Services.Helpers;
using aspnetproject.Infrastructure.Services.Logging;

namespace aspnetproject.Infrastructure.Services.BusinessLogic.Content;

public class ReportService : BaseService
{
    private readonly ReportRepository       _reportRepository;
    private readonly PostRepository         _postRepository;
    private readonly CommentRepository      _commentRepository;
    private readonly UserRepository         _userRepository;
    private readonly AccountSecurityService _accountSecurityService;
    private readonly EventPublisher         _eventPublisher;

    public ReportService(
        ReportRepository       reportRepository,
        PostRepository         postRepository,
        CommentRepository      commentRepository,
        UserRepository         userRepository,
        AccountSecurityService accountSecurityService,
        EventPublisher         eventPublisher,
        DatabaseLogger         dbLogger
        ) : base(dbLogger)
    {
        _reportRepository       = reportRepository;
        _postRepository         = postRepository;
        _commentRepository      = commentRepository;
        _userRepository         = userRepository;
        _accountSecurityService = accountSecurityService;
        _eventPublisher         = eventPublisher;
    }

    // The target must be one the caller may read, so hidden content reads as missing, and must not be the caller or theirs.
    public async Task<ApplicationResponse<StandardReportDto>> CreateReportAsync(int reporterId, bool isAdmin, CreateReportDto createReportDto)
    {
        var response   = new ApplicationResponse<StandardReportDto>();
        var targetType = createReportDto.TargetType!.Value;
        var targetId   = createReportDto.TargetId!.Value;

        var targetCheck = await ValidateTargetAsync(reporterId, isAdmin, targetType, targetId);

        if (targetCheck.Succeeded)
        {
            bool noPendingReport = !await _reportRepository.HasPendingReportAsync(reporterId, targetType, targetId);

            if (noPendingReport)
            {
                var report = ReportMapper.ToEntity(reporterId, createReportDto);
                await _reportRepository.AddAsync(report);
                await PublishReportCreatedAsync(report);

                response.Ok(ReportMapper.ToStandardDisplay(report), ResponseMessages.ReportCreated);
                await LogResultAsync(response.Succeeded, nameof(CreateReportAsync), nameof(Report), $"Reported {targetType} {targetId}", report.Id);
            }
            else
            {
                response.Fail(ResponseMessages.ReportAlreadyPending);
                await LogResultAsync(response.Succeeded, nameof(CreateReportAsync), nameof(Report), $"Could not report {targetType} {targetId}. {response.Message}", null);
            }
        }
        else
        {
            response.Fail(targetCheck.Message);
            await LogResultAsync(response.Succeeded, nameof(CreateReportAsync), nameof(Report), $"Could not report {targetType} {targetId}. {response.Message}", null);
        }

        return response;
    }

    // The target is loaded the way the reports list loads it, so the automation sees what an administrator would. The
    // pending times are read after the commit, so they include this report and only reports still waiting for a decision.
    private async Task PublishReportCreatedAsync(Report report)
    {
        var reporter = await _userRepository.GetUserByIdNoFilterAsync(report.ReporterUserId);

        Post?    post    = null;
        Comment? comment = null;
        User?    user    = null;

        if (report.TargetType == ReportTargetType.Post)
        {
            post = (await _postRepository.GetSnapshotsByIdsAsync([report.TargetId])).SingleOrDefault();
        }
        else if (report.TargetType == ReportTargetType.Comment)
        {
            comment = (await _commentRepository.GetSnapshotsByIdsAsync([report.TargetId])).SingleOrDefault();
        }
        else
        {
            user = (await _userRepository.GetByIdsNoFilterAsync([report.TargetId])).SingleOrDefault();
        }

        var pendingTimes = await _reportRepository.GetPendingTimesForTargetAsync(report.TargetType, report.TargetId);
        var reportEvent  = ReportEventMapper.ToCreatedEvent(report, reporter, post, comment, user, pendingTimes);

        await _eventPublisher.PublishAsync(EventNames.ReportCreated, reportEvent);
    }

    // A report's target has no foreign key, so the page's targets are loaded afterwards: one query per target type.
    // A target id that finds nothing is a target that no longer exists.
    public async Task<ListResponse<AdminReportDto>> GetReportsAsync(ReportListQuery reportQuery)
    {
        var response = new ListResponse<AdminReportDto>();

        var reports = await _reportRepository.GetReportsAsync(reportQuery);

        var postIds    = TargetIdsOf(reports, ReportTargetType.Post);
        var commentIds = TargetIdsOf(reports, ReportTargetType.Comment);
        var userIds    = TargetIdsOf(reports, ReportTargetType.User);

        var posts    = (await _postRepository.GetSnapshotsByIdsAsync(postIds)).ToDictionary(post => post.Id);
        var comments = (await _commentRepository.GetSnapshotsByIdsAsync(commentIds)).ToDictionary(comment => comment.Id);
        var users    = (await _userRepository.GetByIdsNoFilterAsync(userIds)).ToDictionary(user => user.Id);

        var reportDtos = reports
            .Select(report => ReportMapper.ToAdminDisplay(
                report,
                report.TargetType == ReportTargetType.Post    ? posts.GetValueOrDefault(report.TargetId)    : null,
                report.TargetType == ReportTargetType.Comment ? comments.GetValueOrDefault(report.TargetId) : null,
                report.TargetType == ReportTargetType.User    ? users.GetValueOrDefault(report.TargetId)    : null))
            .ToList();

        response.Ok(reportDtos, ResponseMessages.ReportsRetrieved);

        return response;
    }

    public async Task<ApplicationResponse> DecideReportAsync(int reviewerId, int id, ReportDecision decision)
    {
        var response = new ApplicationResponse();
        var report   = await _reportRepository.GetByIdAsync(id);

        bool reportFound = report is not null;
        bool isPending   = report?.Status == ReportStatus.Pending;

        if (reportFound && isPending)
        {
            bool isHide = decision == ReportDecision.Hide;
            response = isHide
                ? await HideAsync(reviewerId, report!)
                : await RejectAsync(reviewerId, id);
        }
        else if (reportFound)
        {
            response.Fail(ResponseMessages.ReportAlreadyDecided);
        }
        else
        {
            response.Fail(ResponseMessages.ReportNotFound);
        }

        await LogResultAsync(response.Succeeded, nameof(DecideReportAsync), nameof(Report), DecisionDetails(report, decision, response), id);

        return response;
    }

    // One transaction, in an order that cannot deadlock:
    // 1. The target is written first. Its row lock queues every other hide of the same target behind this one.
    // 2. The target's other pending reports are resolved. That statement scans Reports, and a scan waits on any report
    //    another transaction holds, so it runs before this transaction holds a report of its own.
    // 3. This report is claimed last, by key. A decision that lost a race finds it decided and rolls back everything.
    private async Task<ApplicationResponse> HideAsync(int reviewerId, Report report)
    {
        var response   = new ApplicationResponse();
        var reviewedAt = DateTime.UtcNow;

        var hideResponse = await _reportRepository.ExecuteInTransactionAsync(async () =>
        {
            var hideResult = await HideTargetAsync(report.TargetType, report.TargetId);

            if (hideResult.Succeeded)
            {
                await _reportRepository.ResolveOtherPendingForTargetAsync(report.Id, report.TargetType, report.TargetId, reviewerId, reviewedAt);

                bool claimed     = await _reportRepository.DecideIfPendingAsync(report.Id, ReportStatus.Resolved, reviewerId, reviewedAt);
                bool lostTheRace = !claimed;

                if (lostTheRace)
                {
                    hideResult.Fail(ResponseMessages.ReportAlreadyDecided);
                }
            }

            return hideResult;
        });

        if (hideResponse.Succeeded)
        {
            response.Ok(ResponseMessages.ReportResolved);

            bool accountDeactivated = hideResponse.Data is not null;
            if (accountDeactivated)
            {
                await _accountSecurityService.NotifyAccountDeactivation(hideResponse.Data!.Email);
            }
        }
        else
        {
            response.Fail(hideResponse.Message);
        }

        return response;
    }

    // A target that finds no row was deleted, so there is nothing to hide; the report stays pending and can be rejected.
    // A user is deactivated through the administrator's deactivation path, which finds active accounts only. Data is that
    // account, so its owner is emailed once the transaction commits.
    private async Task<ApplicationResponse<User?>> HideTargetAsync(ReportTargetType targetType, int targetId)
    {
        var response = new ApplicationResponse<User?>();

        if (targetType == ReportTargetType.Post)
        {
            bool postHidden = await _postRepository.SetModerationStatusAsync(targetId, ModerationStatus.Hidden);
            response = ContentHideResult(postHidden, ResponseMessages.PostNotFound);
        }
        else if (targetType == ReportTargetType.Comment)
        {
            bool commentHidden = await _commentRepository.SetModerationStatusAsync(targetId, ModerationStatus.Hidden);
            response = ContentHideResult(commentHidden, ResponseMessages.CommentNotFound);
        }
        else
        {
            var user = await _userRepository.GetByIdAsync(targetId);

            if (user is not null)
            {
                await _accountSecurityService.DeactivateAccountAsync(user);
                response.Ok(user);
            }
            else
            {
                response.Fail(ResponseMessages.UserNotFound);
            }
        }

        return response;
    }

    private ApplicationResponse<User?> ContentHideResult(bool contentHidden, string notFoundMessage)
    {
        var response = new ApplicationResponse<User?>();

        if (contentHidden)
        {
            response.Ok();
        }
        else
        {
            response.Fail(notFoundMessage);
        }

        return response;
    }

    private string DecisionDetails(Report? report, ReportDecision decision, ApplicationResponse response)
    {
        string details;

        bool isHide = decision == ReportDecision.Hide;

        if (response.Succeeded && isHide)
        {
            details = $"Hid {report!.TargetType} {report.TargetId} and resolved its pending reports";
        }
        else if (response.Succeeded)
        {
            details = $"Rejected the report on {report!.TargetType} {report.TargetId}";
        }
        else
        {
            details = $"Could not {decision} the report. {response.Message}";
        }

        return details;
    }

    // Rejecting touches this report only, so the target and the other reports keep whatever state they have.
    private async Task<ApplicationResponse> RejectAsync(int reviewerId, int id)
    {
        var response = new ApplicationResponse();

        bool rejected = await _reportRepository.DecideIfPendingAsync(id, ReportStatus.Rejected, reviewerId, DateTime.UtcNow);

        if (rejected)
        {
            response.Ok(ResponseMessages.ReportRejected);
        }
        else
        {
            response.Fail(ResponseMessages.ReportAlreadyDecided);
        }

        return response;
    }

    private List<int> TargetIdsOf(List<Report> reports, ReportTargetType targetType)
    {
        return reports
            .Where(report => report.TargetType == targetType)
            .Select(report => report.TargetId)
            .Distinct()
            .ToList();
    }

    private async Task<ApplicationResponse> ValidateTargetAsync(int reporterId, bool isAdmin, ReportTargetType targetType, int targetId)
    {
        var response = new ApplicationResponse();

        if (targetType == ReportTargetType.Post)
        {
            var  post        = await _postRepository.GetReadablePostAsync(targetId, reporterId, isAdmin);
            bool postFound   = post is not null;
            bool isOwnPost   = post?.UserId == reporterId;
            response = CheckTargetOwnership(postFound, isOwnPost, ResponseMessages.PostNotFound, ResponseMessages.CannotReportOwnContent);
        }
        else if (targetType == ReportTargetType.Comment)
        {
            var  comment      = await _commentRepository.GetCommentByIdAsync(targetId, reporterId, isAdmin);
            bool commentFound = comment is not null;
            bool isOwnComment = comment?.CommenterUserId == reporterId;
            response = CheckTargetOwnership(commentFound, isOwnComment, ResponseMessages.CommentNotFound, ResponseMessages.CannotReportOwnContent);
        }
        else
        {
            bool isSelf     = targetId == reporterId;
            bool userExists = isSelf || await _userRepository.ExistsByIdAsync(targetId);
            response = CheckTargetOwnership(userExists, isSelf, ResponseMessages.UserNotFound, ResponseMessages.CannotReportOneself);
        }

        return response;
    }

    private ApplicationResponse CheckTargetOwnership(bool targetFound, bool belongsToReporter, string notFoundMessage, string ownTargetMessage)
    {
        var response = new ApplicationResponse();

        bool isReportable = targetFound && !belongsToReporter;

        if (isReportable)
        {
            response.Ok();
        }
        else if (targetFound)
        {
            response.Fail(ownTargetMessage);
        }
        else
        {
            response.Fail(notFoundMessage);
        }

        return response;
    }
}
