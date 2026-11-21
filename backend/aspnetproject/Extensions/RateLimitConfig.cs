using System.Security.Claims;
using System.Threading.RateLimiting;
using aspnetproject.Common.Domain;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Infrastructure.Services.Automation.Authentication;
using Microsoft.AspNetCore.RateLimiting;

namespace aspnetproject.Extensions;

public static class RateLimitConfig
{
    private const string AutomationBucketName = "automation";

    public static class Policies
    {
        #region Admin
        public const string AdminReadLogs       = "AdminReadLogs";
        public const string AdminListAccounts   = "AdminListAccounts";
        public const string AdminReadStatistics = "AdminReadStatistics";

        public const string AdminModeratePost        = "AdminModeratePost";
        public const string AdminModerateComment     = "AdminModerateComment";
        public const string AdminReadFlaggedPosts    = "AdminReadFlaggedPosts";
        public const string AdminReadFlaggedComments = "AdminReadFlaggedComments";
        #endregion

        #region Auth
        public const string Register             = "Register";
        public const string Login                = "Login";
        public const string Refresh              = "Refresh";
        public const string RequestPasswordReset = "RequestPasswordReset";
        public const string ResetPassword        = "ResetPassword";
        #endregion

        #region AccountManagement
        public const string DeleteOwnAccount       = "DeleteOwnAccount";
        public const string AdminDeleteAccount     = "AdminDeleteAccount";
        public const string DeactivateOwnAccount   = "DeactivateOwnAccount";
        public const string AdminDeactivateAccount = "AdminDeactivateAccount";
        public const string AdminActivateAccount   = "AdminActivateAccount";
        public const string RequestActivation      = "RequestActivation";
        public const string ConfirmActivation      = "ConfirmActivation";
        #endregion

        #region Comments
        public const string CreateComment     = "CreateComment";
        public const string GetOwnComments    = "GetOwnComments";
        public const string GetCommentsByPost = "GetCommentsByPost";
        public const string GetCommentById    = "GetCommentById";
        public const string EditComment       = "EditComment";
        public const string DeleteComment     = "DeleteComment";
        #endregion

        #region Development
        public const string ThrowOnPurpose = "ThrowOnPurpose";
        #endregion

        #region Friendships
        public const string SendFriendRequest    = "SendFriendRequest";
        public const string ReadFriendships      = "ReadFriendships";
        public const string RespondFriendRequest = "RespondFriendRequest";
        public const string RemoveFriend         = "RemoveFriend";
        #endregion

        #region Likes
        public const string LikePost      = "LikePost";
        public const string UnlikePost    = "UnlikePost";
        public const string ReadPostLikes = "ReadPostLikes";
        #endregion

        #region Messages
        public const string SendMessage            = "SendMessage";
        public const string ReadMessages           = "ReadMessages";
        public const string MarkConversationAsRead = "MarkConversationAsRead";
        public const string EditMessage            = "EditMessage";
        public const string DeleteMessage          = "DeleteMessage";
        #endregion

        #region Posts
        public const string CreatePost = "CreatePost";
        public const string ReadPosts  = "ReadPosts";
        public const string UpdatePost = "UpdatePost";
        public const string DeletePost = "DeletePost";

        public const string RemovePostImage = "RemovePostImage";
        #endregion

        #region Reports
        public const string CreateReport      = "CreateReport";
        public const string AdminReadReports  = "AdminReadReports";
        public const string AdminDecideReport = "AdminDecideReport";
        #endregion

        #region Users
        public const string AdminCreateUser  = "AdminCreateUser";
        public const string ReadUserProfile  = "ReadUserProfile";
        public const string SearchUsers      = "SearchUsers";
        public const string UpdateOwnProfile = "UpdateOwnProfile";
        public const string AdminUpdateUser  = "AdminUpdateUser";
        #endregion
    }

    public static void AddApplicationRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = WriteRejectionEnvelopeAsync;

            #region Admin
            options.AddPolicy(Policies.AdminReadLogs, httpContext =>
                PerUserSlidingWindow(httpContext, 120, TimeSpan.FromMinutes(1)));

            options.AddPolicy(Policies.AdminListAccounts, httpContext =>
                PerUserSlidingWindow(httpContext, 120, TimeSpan.FromMinutes(1)));

            // Lower than the list reads: one request runs a dozen count queries.
            options.AddPolicy(Policies.AdminReadStatistics, httpContext =>
                PerUserSlidingWindow(httpContext, 30, TimeSpan.FromMinutes(1)));

            options.AddPolicy(Policies.AdminModeratePost, httpContext =>
                PerUserSlidingWindow(httpContext, 60, TimeSpan.FromMinutes(10)));

            options.AddPolicy(Policies.AdminModerateComment, httpContext =>
                PerUserSlidingWindow(httpContext, 60, TimeSpan.FromMinutes(10)));

            options.AddPolicy(Policies.AdminReadFlaggedPosts, httpContext =>
                PerUserSlidingWindow(httpContext, 120, TimeSpan.FromMinutes(1)));

            options.AddPolicy(Policies.AdminReadFlaggedComments, httpContext =>
                PerUserSlidingWindow(httpContext, 120, TimeSpan.FromMinutes(1)));
            #endregion

            #region Auth (IP-based, pre-authentication)
            // Per IP, so everyone behind one address (a classroom, a mobile network) shares each limit. Login has no
            // account lockout behind it, so it stays limited; the token steps (ResetPassword, ConfirmActivation) carry
            // an unguessable token, so their limits only stop hammering (owner, 2026-11-20).
            options.AddPolicy(Policies.Login, httpContext =>
                PerIpSlidingWindow(httpContext, 20, TimeSpan.FromMinutes(15)));

            options.AddPolicy(Policies.Register, httpContext =>
                PerIpSlidingWindow(httpContext, 10, TimeSpan.FromHours(1)));

            options.AddPolicy(Policies.Refresh, httpContext =>
                PerIpSlidingWindow(httpContext, 60, TimeSpan.FromMinutes(10)));

            options.AddPolicy(Policies.RequestPasswordReset, httpContext =>
                PerIpSlidingWindow(httpContext, 10, TimeSpan.FromMinutes(15)));

            options.AddPolicy(Policies.ResetPassword, httpContext =>
                PerIpSlidingWindow(httpContext, 20, TimeSpan.FromMinutes(15)));
            #endregion

            #region Account Management 
            options.AddPolicy(Policies.DeleteOwnAccount, httpContext =>
                PerUserSlidingWindow(httpContext, 3, TimeSpan.FromHours(24), segments: 4));

            options.AddPolicy(Policies.AdminDeleteAccount, httpContext =>
                PerUserSlidingWindow(httpContext, 30, TimeSpan.FromHours(1)));

            options.AddPolicy(Policies.DeactivateOwnAccount, httpContext =>
                PerUserSlidingWindow(httpContext, 5, TimeSpan.FromHours(1)));

            options.AddPolicy(Policies.AdminDeactivateAccount, httpContext =>
                PerUserSlidingWindow(httpContext, 30, TimeSpan.FromHours(1)));

            options.AddPolicy(Policies.AdminActivateAccount, httpContext =>
                PerUserSlidingWindow(httpContext, 30, TimeSpan.FromHours(1)));

            // Per IP, like the reset request: each call sends an email, and a retry after a typo or a mail in the
            // spam folder must still get through.
            options.AddPolicy(Policies.RequestActivation, httpContext =>
                PerIpSlidingWindow(httpContext, 10, TimeSpan.FromMinutes(15)));

            options.AddPolicy(Policies.ConfirmActivation, httpContext =>
                PerIpSlidingWindow(httpContext, 20, TimeSpan.FromMinutes(15)));
            #endregion

            #region Comments
            options.AddPolicy(Policies.CreateComment, httpContext =>
                PerUserSlidingWindow(httpContext, 20, TimeSpan.FromMinutes(10)));

            options.AddPolicy(Policies.GetOwnComments, httpContext =>
                PerUserSlidingWindow(httpContext, 120, TimeSpan.FromMinutes(1)));

            options.AddPolicy(Policies.GetCommentsByPost, httpContext =>
                PerUserSlidingWindow(httpContext, 120, TimeSpan.FromMinutes(1)));

            options.AddPolicy(Policies.GetCommentById, httpContext =>
                PerUserSlidingWindow(httpContext, 120, TimeSpan.FromMinutes(1)));

            options.AddPolicy(Policies.EditComment, httpContext =>
                PerUserSlidingWindow(httpContext, 20, TimeSpan.FromMinutes(10)));

            options.AddPolicy(Policies.DeleteComment, httpContext =>
                PerUserSlidingWindow(httpContext, 20, TimeSpan.FromMinutes(10)));
            #endregion

            #region Development (IP-based, the route is mapped only in Development)
            options.AddPolicy(Policies.ThrowOnPurpose, httpContext =>
                PerIpSlidingWindow(httpContext, 30, TimeSpan.FromMinutes(1)));
            #endregion

            #region Friendships
            options.AddPolicy(Policies.SendFriendRequest, httpContext =>
                PerUserSlidingWindow(httpContext, 30, TimeSpan.FromHours(1)));

            options.AddPolicy(Policies.ReadFriendships, httpContext =>
                PerUserSlidingWindow(httpContext, 120, TimeSpan.FromMinutes(1)));

            options.AddPolicy(Policies.RespondFriendRequest, httpContext =>
                PerUserSlidingWindow(httpContext, 60, TimeSpan.FromHours(1)));

            options.AddPolicy(Policies.RemoveFriend, httpContext =>
                PerUserSlidingWindow(httpContext, 30, TimeSpan.FromHours(1)));
            #endregion

            #region Likes
            options.AddPolicy(Policies.LikePost, httpContext =>
                PerUserSlidingWindow(httpContext, 60, TimeSpan.FromMinutes(10)));

            options.AddPolicy(Policies.UnlikePost, httpContext =>
                PerUserSlidingWindow(httpContext, 60, TimeSpan.FromMinutes(10)));

            options.AddPolicy(Policies.ReadPostLikes, httpContext =>
                PerUserSlidingWindow(httpContext, 120, TimeSpan.FromMinutes(1)));
            #endregion

            #region Messages 
            options.AddPolicy(Policies.SendMessage, httpContext =>
                PerUserSlidingWindow(httpContext, 60, TimeSpan.FromMinutes(1)));

            options.AddPolicy(Policies.ReadMessages, httpContext =>
                PerUserSlidingWindow(httpContext, 120, TimeSpan.FromMinutes(1)));

            options.AddPolicy(Policies.MarkConversationAsRead, httpContext =>
                PerUserSlidingWindow(httpContext, 120, TimeSpan.FromMinutes(1)));

            options.AddPolicy(Policies.EditMessage, httpContext =>
                PerUserSlidingWindow(httpContext, 30, TimeSpan.FromMinutes(1)));

            options.AddPolicy(Policies.DeleteMessage, httpContext =>
                PerUserSlidingWindow(httpContext, 30, TimeSpan.FromMinutes(1)));
            #endregion

            #region Posts
            options.AddPolicy(Policies.CreatePost, httpContext =>
                PerUserSlidingWindow(httpContext, 30, TimeSpan.FromHours(1)));

            options.AddPolicy(Policies.ReadPosts, httpContext =>
                PerUserSlidingWindow(httpContext, 120, TimeSpan.FromMinutes(1)));

            options.AddPolicy(Policies.UpdatePost, httpContext =>
                PerUserSlidingWindow(httpContext, 20, TimeSpan.FromHours(1)));

            options.AddPolicy(Policies.DeletePost, httpContext =>
                PerUserSlidingWindow(httpContext, 20, TimeSpan.FromHours(1)));

            // Higher than a post delete: clearing a post of photos is one request per photo, up to ImageStorage:MaxImagesPerPost per post.
            options.AddPolicy(Policies.RemovePostImage, httpContext =>
                PerUserSlidingWindow(httpContext, 60, TimeSpan.FromHours(1)));
            #endregion

            #region Reports
            options.AddPolicy(Policies.CreateReport, httpContext =>
                PerUserSlidingWindow(httpContext, 20, TimeSpan.FromHours(1)));

            options.AddPolicy(Policies.AdminReadReports, httpContext =>
                PerUserSlidingWindow(httpContext, 120, TimeSpan.FromMinutes(1)));

            options.AddPolicy(Policies.AdminDecideReport, httpContext =>
                PerUserSlidingWindow(httpContext, 60, TimeSpan.FromMinutes(10)));
            #endregion

            #region Users
            options.AddPolicy(Policies.AdminCreateUser, httpContext =>
                PerUserSlidingWindow(httpContext, 20, TimeSpan.FromHours(1)));

            options.AddPolicy(Policies.ReadUserProfile, httpContext =>
                PerUserSlidingWindow(httpContext, 120, TimeSpan.FromMinutes(1)));

            options.AddPolicy(Policies.SearchUsers, httpContext =>
                PerUserSlidingWindow(httpContext, 60, TimeSpan.FromMinutes(1)));

            options.AddPolicy(Policies.UpdateOwnProfile, httpContext =>
                PerUserSlidingWindow(httpContext, 30, TimeSpan.FromHours(1)));

            options.AddPolicy(Policies.AdminUpdateUser, httpContext =>
                PerUserSlidingWindow(httpContext, 30, TimeSpan.FromHours(1)));
            #endregion
            
            #region Global

            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
                PerUserSlidingWindow(httpContext, 300, TimeSpan.FromMinutes(1)));
            #endregion
        });
    }

    // Runs for every endpoint policy and the global limiter, after RejectionStatusCode has been set.
    private static async ValueTask WriteRejectionEnvelopeAsync(OnRejectedContext context, CancellationToken cancellationToken)
    {
        var response = new ApplicationResponse();
        response.Fail(ResponseMessages.TooManyRequests);

        await context.HttpContext.Response.WriteAsJsonAsync(response, cancellationToken);
    }

    // The automation has no user id, and UseAuthentication has not run its scheme by now (only the default, JWT, runs there), so the
    // limiter asks the key validator itself. Only a valid key gets the bucket: a wrong key falls back to the address, so a stranger
    // cannot use up the automation's budget. The key never equals a user id or an address, so the buckets cannot collide.
    private static string? AutomationPartitionKey(HttpContext httpContext)
    {
        var  keyValidator = httpContext.RequestServices.GetRequiredService<AutomationKeyValidator>();
        bool isAutomation = keyValidator.HasKeyHeader(httpContext.Request) && keyValidator.IsValid(httpContext.Request);

        return isAutomation ? AutomationBucketName : null;
    }

    private static RateLimitPartition<string> PerIpSlidingWindow(HttpContext httpContext, int permitLimit, TimeSpan window)
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

        var windowLimiter = RateLimitPartition.GetSlidingWindowLimiter(ip, _ => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = permitLimit,
            Window = window,
            SegmentsPerWindow = 3,
            QueueLimit = 0
        });

        return windowLimiter;
    }

    private static RateLimitPartition<string> PerUserSlidingWindow(HttpContext httpContext, int permitLimit, TimeSpan window, int segments = 4)
    {
        var partitionKey = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? AutomationPartitionKey(httpContext)
            ?? httpContext.Connection.RemoteIpAddress?.ToString()
            ?? "unknown";

        var windowLimiter = RateLimitPartition.GetSlidingWindowLimiter(partitionKey, _ => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = permitLimit,
            Window = window,
            SegmentsPerWindow = segments,
            QueueLimit = 0
        });

        return windowLimiter;
    }
}