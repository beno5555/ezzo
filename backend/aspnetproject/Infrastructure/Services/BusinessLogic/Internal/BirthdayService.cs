using aspnetproject.Common.Domain;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Data.Repositories;
using aspnetproject.Infrastructure.Dtos.Internal;
using aspnetproject.Infrastructure.Mappers;
using aspnetproject.Infrastructure.Queries;
using aspnetproject.Infrastructure.Services.BusinessLogic.Base;
using aspnetproject.Infrastructure.Services.Logging;

namespace aspnetproject.Infrastructure.Services.BusinessLogic.Internal;

// Who the automation tells about a friend's birthday. The digest switch has no effect here.
public class BirthdayService : BaseService
{
    private readonly FriendshipRepository _friendshipRepository;

    public BirthdayService(FriendshipRepository friendshipRepository, DatabaseLogger dbLogger) : base(dbLogger)
    {
        _friendshipRepository = friendshipRepository;
    }

    public async Task<ListResponse<BirthdayRecipientDto>> GetBirthdayRecipientsAsync(BirthdayListQuery birthdayQuery)
    {
        var response = new ListResponse<BirthdayRecipientDto>();

        var date = birthdayQuery.Date ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var days = BirthdayDaysOn(date);

        var recipientIds = await _friendshipRepository.GetBirthdayRecipientIdsAsync(date.Month, days, birthdayQuery.PageNumber, birthdayQuery.PageSize);
        var pairs        = await _friendshipRepository.GetBirthdayFriendsAsync(date.Month, days, recipientIds);

        response.Ok(BirthdayMapper.ToRecipients(pairs), ResponseMessages.BirthdaysRetrieved);

        return response;
    }

    // A birthday matches on month and day. On 28 February of a year without 29 February, a 29 February birthday matches too.
    private static List<int> BirthdayDaysOn(DateOnly date)
    {
        List<int> days = [date.Day];

        bool isFebruary28OfACommonYear = date.Month == Constants.February && date.Day == Constants.LastDayOfFebruaryInACommonYear && !DateTime.IsLeapYear(date.Year);

        if (isFebruary28OfACommonYear)
        {
            days.Add(Constants.LeapDay);
        }

        return days;
    }
}
