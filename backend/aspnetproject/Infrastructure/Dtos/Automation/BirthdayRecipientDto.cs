using aspnetproject.Infrastructure.Dtos.Users;

namespace aspnetproject.Infrastructure.Dtos.Automation;

// A row of GET /api/internal/birthdays, for the automation only: a user to tell, and the friends whose birthday it is.
// Friends is passed on unchanged as the data of a BIRTHDAY notification.
public class BirthdayRecipientDto
{
    public int    Id       { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email    { get; set; } = string.Empty;

    public List<MinimalUserDto> Friends { get; set; } = [];
}
