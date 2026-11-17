using aspnetproject.Data.Models;
using aspnetproject.Infrastructure.Dtos.Automation;

namespace aspnetproject.Infrastructure.Mappers;

public static class AccountEventMapper
{
    public static AccountCreatedEventDto ToCreatedEvent(User user)
    {
        return new AccountCreatedEventDto
        {
            UserId   = user.Id,
            Username = user.Username,
            Email    = user.Email
        };
    }
}
