using System.ComponentModel.DataAnnotations;
using aspnetproject.Infrastructure.Dtos.Users;

namespace aspnetproject.Infrastructure.Dtos.Internal;

// The data of a BIRTHDAY notification: the friends whose birthday it is, as a row of GET /api/internal/birthdays lists them.
public class BirthdayNotificationDataDto
{
    [Required]
    [MinLength(1)]
    public List<MinimalUserDto>? Friends { get; set; }
}
