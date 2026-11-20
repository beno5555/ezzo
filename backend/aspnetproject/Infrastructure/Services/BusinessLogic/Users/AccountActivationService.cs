using aspnetproject.Common.Domain;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Data.Models;
using aspnetproject.Data.Repositories;
using aspnetproject.Infrastructure.Dtos.Accounts;
using aspnetproject.Infrastructure.Dtos.Users;
using aspnetproject.Infrastructure.Mappers;
using aspnetproject.Infrastructure.Services.BusinessLogic.Base;
using aspnetproject.Infrastructure.Services.Helpers;
using aspnetproject.Infrastructure.Services.Logging;

namespace aspnetproject.Infrastructure.Services.BusinessLogic.Users;

public class AccountActivationService : BaseService
{
    private readonly UserRepository         _userRepository;
    private readonly AccountSecurityService _accountSecurityService;
    private readonly TokenGenerator         _tokenGenerator;
    private readonly UrlSecurityService     _urlSecurityService;

    public AccountActivationService(
        UserRepository userRepository,
        AccountSecurityService accountSecurityService,
        TokenGenerator tokenGenerator,
        UrlSecurityService urlSecurityService,
        DatabaseLogger dbLogger
        ) : base(dbLogger)
    {
        _userRepository = userRepository;
        _accountSecurityService = accountSecurityService;
        _tokenGenerator = tokenGenerator;
        _urlSecurityService = urlSecurityService;
    }
    
    
    public async Task<ApplicationResponse> DeactivateAccountAsync(int id)
    {
        var response = new ApplicationResponse();
        
        var user = await _userRepository.GetByIdAsync(id);
        if (user is not null)
        {
            await _accountSecurityService.DeactivateAccountAsync(user);

            response.Ok(ResponseMessages.AccountDeactivated);
            await LogResultAsync(response.Succeeded, nameof(DeactivateAccountAsync), nameof(User), null, id);
            await _accountSecurityService.NotifyAccountDeactivation(user.Email);
        }
        else
        {
            response.Fail(ResponseMessages.UserNotFound);
            await LogResultAsync(response.Succeeded, nameof(DeactivateAccountAsync), nameof(User), $"{ResponseMessages.CouldNotDeactivateAccount}: {response.Message}", null);
        }

        return response;
    }
    public async Task<ApplicationResponse<FullUserDto>> ReactivateAccountAsync(int id)
    {
        var response = new ApplicationResponse<FullUserDto>();
        
        var user = await _userRepository.GetDeactivatedByIdAsync(id);
        if (user is not null)
        {
            user.AccountDeactivatedAt = null;
            await _userRepository.SaveChangesAsync();
            
            var userDto = UserMapper.ToFullDisplay(user);

            await _accountSecurityService.NotifyAccountReactivation(user.Email);
            
            response.Ok(userDto, ResponseMessages.AccountActivated);
            await LogResultAsync(response.Succeeded, nameof(ReactivateAccountAsync), nameof(User), null, id);
        }
        else
        {
            response.Fail(ResponseMessages.UserNotFound);
            await LogResultAsync(response.Succeeded, nameof(ReactivateAccountAsync), nameof(User), response.Message, null);
        }

        return response;
    }
    // The return address is checked before a token is issued, so a refused request sends no email and leaves any
    // earlier token working.
    public async Task<ApplicationResponse> RequestAccountActivationAsync(ActivationRequestDto activationRequestDto)
    {
        var response = new ApplicationResponse();

        var user = await _userRepository.GetDeactivatedByEmailAsync(activationRequestDto.Email);
        if (user is not null)
        {
            bool urlAllowed = activationRequestDto.RedirectUrl is null || _urlSecurityService.IsAllowedRedirect(activationRequestDto.RedirectUrl);
            if (urlAllowed)
            {
                bool emailSent = await _accountSecurityService.HandleAccountActivationRequest(user, activationRequestDto.RedirectUrl);
                if (emailSent)
                {
                    response.Ok(ResponseMessages.AccountActivationTokenSentToEmail);
                    await LogResultAsync(response.Succeeded, nameof(RequestAccountActivationAsync), nameof(User), null, user.Id);
                }
                else
                {
                    response.Fail(ResponseMessages.CouldNotSendEmail);
                    await LogResultAsync(response.Succeeded, nameof(RequestAccountActivationAsync), nameof(User), response.Message, user.Id);
                }
            }
            else
            {
                response.Fail(ResponseMessages.UrlOriginNotAllowed);
                await LogResultAsync(response.Succeeded, nameof(RequestAccountActivationAsync), nameof(User), response.Message, user.Id);
            }
        }
        else
        {
            response.Fail(ResponseMessages.UserNotFound);
            await LogResultAsync(response.Succeeded, nameof(RequestAccountActivationAsync), nameof(User), response.Message, null);
        }

        return response;
    }  
    public async Task<ApplicationResponse<FullUserDto>> ReactivateOwnAccountAsync(string activationToken)
    {
        var response = new ApplicationResponse<FullUserDto>();

        var tokenHash = _tokenGenerator.HashToken(activationToken);
        var user      = await _userRepository.GetDeactivatedAccountByActivationTokenHashAsync(tokenHash);
        
        if (user is not null)
        {
            await _userRepository.ActivateAccountAsync(user);
            
            var userDto = UserMapper.ToFullDisplay(user);
            response.Ok(userDto, ResponseMessages.AccountActivated + ". " + ResponseMessages.YouCanNowSignIn);
            await LogResultAsync(response.Succeeded, nameof(ReactivateOwnAccountAsync), nameof(User), null, user.Id);
            
            await _accountSecurityService.NotifyAccountReactivation(user.Email);
        }
        else
        {
            response.Fail(ResponseMessages.InvalidOrExpiredActivationToken);
            await LogResultAsync(response.Succeeded, nameof(ReactivateOwnAccountAsync), nameof(User), response.Message, null);
        }

        return response;
    }
}