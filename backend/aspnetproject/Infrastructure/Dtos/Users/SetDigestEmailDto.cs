using System.ComponentModel.DataAnnotations;

namespace aspnetproject.Infrastructure.Dtos.Users;

// The digest switch on its own, never part of EditUserDto: a profile update replaces the whole profile, so a client that
// did not know the field would switch the digest off. Nullable so that a missing value fails validation instead of binding to false.
public class SetDigestEmailDto
{
    [Required]
    public bool? Enabled { get; set; }
}
