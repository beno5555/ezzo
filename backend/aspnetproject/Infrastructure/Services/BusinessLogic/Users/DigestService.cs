using aspnetproject.Common.Domain;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Data.Repositories;
using aspnetproject.Infrastructure.Dtos.Automation;
using aspnetproject.Infrastructure.Mappers;
using aspnetproject.Infrastructure.Queries;
using aspnetproject.Infrastructure.Services.BusinessLogic.Base;
using aspnetproject.Infrastructure.Services.Logging;

namespace aspnetproject.Infrastructure.Services.BusinessLogic.Users;

// The list the automation reads to send the weekly digest (docs/backend/automation.md). Only the automation calls it;
// a successful read writes no Log row, like UserService.GetAccountsAsync, since the automation pages through it every week.
public class DigestService : BaseService
{
    private readonly UserRepository _userRepository;

    public DigestService(UserRepository userRepository, DatabaseLogger dbLogger) : base(dbLogger)
    {
        _userRepository = userRepository;
    }

    public async Task<ListResponse<DigestRecipientDto>> GetDigestRecipientsAsync(PageQuery pageQuery)
    {
        var response = new ListResponse<DigestRecipientDto>();

        var since      = DateTime.UtcNow - Constants.DigestPostWindow;
        var recipients = await _userRepository.GetDigestRecipientsAsync(since, Constants.DigestPostLimit, pageQuery);
        var rows       = recipients.Select(DigestMapper.ToDigestRecipient).ToList();

        response.Ok(rows, ResponseMessages.DigestRetrieved);

        return response;
    }
}
