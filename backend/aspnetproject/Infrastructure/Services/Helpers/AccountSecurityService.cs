using System.Net;
using aspnetproject.Data.Models;
using aspnetproject.Data.Repositories;
using aspnetproject.Infrastructure.Dtos.Auth;
using Microsoft.AspNetCore.WebUtilities;

namespace aspnetproject.Infrastructure.Services.Helpers;

public class AccountSecurityService
{
    private readonly UserRepository         _userRepository;
    private readonly TokenGenerator         _tokenGenerator;
    private readonly EmailSender            _emailSender;
    private readonly RefreshTokenRepository _refreshTokenRepository;

    private readonly int     _resetTokenMinutes;
    private readonly int     _refreshTokenDays;

    public AccountSecurityService(
        UserRepository userRepository,
        TokenGenerator tokenGenerator,
        EmailSender emailSender,
        RefreshTokenRepository refreshTokenRepository,
        IConfiguration configuration
        )
    {
        _userRepository = userRepository;
        _tokenGenerator = tokenGenerator;
        _emailSender = emailSender;
        _refreshTokenRepository = refreshTokenRepository;

        _resetTokenMinutes = configuration.GetValue<int>("PasswordConfiguration:ResetTokenMinutes");
        _refreshTokenDays = configuration.GetValue<int>("Jwt:RefreshTokenDays");
    }

    public async Task<bool> HandlePasswordResetRequest(User user, string? redirectUrl)
    {
        var resetToken = _tokenGenerator.GenerateRefreshToken();
        await IssueResetTokenAsync(user, resetToken);
        var sentEmail = await NotifyPasswordResetRequest(user.Email, resetToken, redirectUrl);

        return sentEmail;
    }
    public async Task HandleFailedRegisterAttempt(User user)
    {
        string resetToken = _tokenGenerator.GenerateRefreshToken();

        await IssueResetTokenAsync(user, resetToken);
        await _emailSender.SendAsync(
            user.Email,
            "Someone tried to register with your email",
            $"<p>Someone tried to create an account using this email address, which is already registered.</p><p>If this was you, you can reset your password using this token: {resetToken}</p><p>Token expires in {_resetTokenMinutes} minutes.</p><p>If this wasn't you, you can safely ignore this email.</p>"
        );
    }
    public async Task<bool> HandleAccountActivationRequest(User user, string? redirectUrl)
    {
        var activationToken = _tokenGenerator.GenerateRefreshToken();

        await IssueResetTokenAsync(user, activationToken);
        bool emailSent = await NotifyAccountReactivationRequest(user.Email, activationToken, redirectUrl);

        return emailSent;
    }
    
    private async Task IssueResetTokenAsync(User user, string rawResetToken)
    {
        var tokenHash = _tokenGenerator.HashToken(rawResetToken);
        user.ResetTokenHash = tokenHash;

        user.ResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(_resetTokenMinutes);
        await _userRepository.SaveChangesAsync();
    }
    public async Task<AuthResultDto> IssueAccessAndRefreshTokensAsync(User user)
    {
        var accessToken     = _tokenGenerator.GenerateAccessToken(user);
        var rawRefreshToken = _tokenGenerator.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = _tokenGenerator.HashToken(rawRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(_refreshTokenDays)
        };

        await _refreshTokenRepository.AddAsync(refreshToken);

        var tokens = new AuthResultDto
        {
            AccessToken = accessToken,
            RefreshToken = rawRefreshToken
        };

        return tokens;
    }

    // The data side of deactivating an account, shared by the administrator's route, self-deactivation and a report
    // decision that hides a user. The caller writes the Log row and sends NotifyAccountDeactivation, after its
    // transaction commits if it runs inside one, so a rolled-back deactivation never emails its owner.
    public async Task DeactivateAccountAsync(User user)
    {
        user.AccountDeactivatedAt = DateTime.UtcNow;
        await _userRepository.SaveChangesAsync();

        await _refreshTokenRepository.RevokeAllForUserAsync(user.Id);
    }

    public async Task NotifyAccountDeactivation(string userEmail)
    {
        await _emailSender.SendAsync(
            userEmail,
            "Your account has been deactivated", 
            "<p>Your account has been deactivated. To reactivate it, request a reactivation link using this email address.</p><p>If you did not expect this, please contact support.</p>"
        );
    }
    private async Task<bool> NotifyAccountReactivationRequest(string userEmail, string activationToken, string? redirectUrl)
    {
        var message = string.IsNullOrEmpty(redirectUrl)
            ? $"<p>You requested to reactivate your account.</p><p>You can reactivate using this token: {activationToken}</p>" +
              $"<p>Token expires in {_resetTokenMinutes} minutes.</p>"
            : $"<p>You requested to reactivate your account. Open the link below, then press the button on the page:</p>" +
              $"<p>{BuildTokenLink(redirectUrl, activationToken, "Reactivate account")}</p>" +
              $"<p>This link expires in {_resetTokenMinutes} minutes.</p>";

        return await _emailSender.SendAsync(
            userEmail,
            "Reactivate your account",
            message + "<p>If you did not request this, you can safely ignore this email.</p>"
        );
    }
    private async Task<bool> NotifyPasswordResetRequest(string userEmail, string resetToken, string? redirectUrl)
    {
        var message = string.IsNullOrEmpty(redirectUrl)
            ? $"<p>Your password reset token: {resetToken}</p><p>Token expires in {_resetTokenMinutes} minutes.</p>"
            : $"<p>Click the link below to reset your password:</p>" +
              $"<p>{BuildTokenLink(redirectUrl, resetToken, "Reset password")}</p>" +
              $"<p>This link expires in {_resetTokenMinutes} minutes.</p>";

        return await _emailSender.SendAsync(userEmail, "Reset your password", message);
    }

    // An emailed link to a return address the caller already checked with UrlSecurityService, with the token in the
    // query string. The address is HTML-escaped, so a quote in it cannot close the href and add markup to the email.
    private static string BuildTokenLink(string redirectUrl, string token, string linkText)
    {
        var address = QueryHelpers.AddQueryString(redirectUrl, "token", token);

        return $"<a href=\"{WebUtility.HtmlEncode(address)}\">{linkText}</a>";
    }
    public async Task NotifyAccountReactivation(string userEmail)
    {
        await _emailSender.SendAsync(
            userEmail, 
            "Your account has been reactivated",
            "<p>Your account has been reactivated and you can now sign in as usual.</p><p>If you did not expect this, please contact support.</p>"
            );
    }
    public async Task NotifyPasswordReset(string userEmail)
    {
        await _emailSender.SendAsync(
            userEmail, 
            "Your password has been reset",
            "<p>Your password was just reset.</p><p>If you did not do this, please contact support immediately.</p>"
        );
    }
}