using aspnetproject.Common.Domain;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Data.Repositories;
using aspnetproject.Infrastructure.Dtos.Statistics;
using aspnetproject.Infrastructure.Services.BusinessLogic.Base;
using aspnetproject.Infrastructure.Services.Helpers;
using aspnetproject.Infrastructure.Services.Logging;

namespace aspnetproject.Infrastructure.Services.BusinessLogic;

public class StatisticsService : BaseService
{
    private readonly UserRepository        _userRepository;
    private readonly PostRepository        _postRepository;
    private readonly CommentRepository     _commentRepository;
    private readonly MessageRepository     _messageRepository;
    private readonly PostLikeRepository    _postLikeRepository;
    private readonly ReportRepository      _reportRepository;
    private readonly UserConnectionTracker _userConnectionTracker;

    public StatisticsService(
        UserRepository        userRepository,
        PostRepository        postRepository,
        CommentRepository     commentRepository,
        MessageRepository     messageRepository,
        PostLikeRepository    postLikeRepository,
        ReportRepository      reportRepository,
        UserConnectionTracker userConnectionTracker,
        DatabaseLogger        dbLogger
        ) : base(dbLogger)
    {
        _userRepository        = userRepository;
        _postRepository        = postRepository;
        _commentRepository     = commentRepository;
        _messageRepository     = messageRepository;
        _postLikeRepository    = postLikeRepository;
        _reportRepository      = reportRepository;
        _userConnectionTracker = userConnectionTracker;
    }

    // A successful read writes no Log row, so reading the statistics does not fill the logs. Both windows end at the
    // same instant, taken once. The counts are read one after another: they share one DbContext, which runs one query at a time.
    public async Task<ApplicationResponse<SystemStatisticsDto>> GetStatisticsAsync()
    {
        var response = new ApplicationResponse<SystemStatisticsDto>();

        var now = DateTime.UtcNow;

        var statistics = new SystemStatisticsDto
        {
            Totals = await GetTotalsAsync(),
            Activity = new StatisticsActivityDto
            {
                Last7Days  = await GetActivityAsync(now - Constants.StatisticsShortWindow),
                Last30Days = await GetActivityAsync(now - Constants.StatisticsLongWindow)
            },
            OnlineUsers = _userConnectionTracker.GetOnlineUserCount()
        };

        response.Ok(statistics, ResponseMessages.StatisticsRetrieved);

        return response;
    }

    private async Task<StatisticsTotalsDto> GetTotalsAsync()
    {
        var totals = new StatisticsTotalsDto
        {
            ActiveAccounts      = await _userRepository.CountActiveAsync(),
            DeactivatedAccounts = await _userRepository.CountDeactivatedAsync(),
            Posts               = await _postRepository.CountAsync(),
            Comments            = await _commentRepository.CountAsync(),
            Messages            = await _messageRepository.CountAsync(),
            Likes               = await _postLikeRepository.CountAsync(),
            PendingReports      = await _reportRepository.CountPendingAsync()
        };

        return totals;
    }

    private async Task<ActivityCountsDto> GetActivityAsync(DateTime since)
    {
        var activity = new ActivityCountsDto
        {
            Accounts = await _userRepository.CountAccountsCreatedSinceAsync(since),
            Posts    = await _postRepository.CountCreatedSinceAsync(since),
            Comments = await _commentRepository.CountCreatedSinceAsync(since),
            Messages = await _messageRepository.CountCreatedSinceAsync(since)
        };

        return activity;
    }
}
