using aspnetproject.Data.Repositories.Dtos;
using aspnetproject.Infrastructure.Dtos.Internal;
using aspnetproject.Infrastructure.Dtos.Users;

namespace aspnetproject.Infrastructure.Mappers;

public static class BirthdayMapper
{
    // One row per recipient, in the order the pairs come in (by recipient id, then friend id).
    public static List<BirthdayRecipientDto> ToRecipients(List<BirthdayFriendProjection> pairs)
    {
        return pairs
            .GroupBy(pair => pair.RecipientId)
            .Select(group => new BirthdayRecipientDto
            {
                Id       = group.Key,
                Username = group.First().RecipientUsername,
                Email    = group.First().RecipientEmail,
                Friends  = group.Select(pair => new MinimalUserDto { Id = pair.FriendId, Username = pair.FriendUsername }).ToList()
            })
            .ToList();
    }
}
