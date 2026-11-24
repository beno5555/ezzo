using aspnetproject.Common.ProjectConstants;
using aspnetproject.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace aspnetproject.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users", table => table.HasCheckConstraint("CK_User_DateOfBirth", 
            "DATEDIFF(year, DateOfBirth, GETUTCDATE()) BETWEEN 13 AND 100") );
        builder.HasKey(user => user.Id);

        builder.Property(user => user.Username)
            .IsRequired()
            .HasMaxLength(Constants.UsernameMaxlength);
        
        builder.Property(user => user.Email)
            .IsRequired()
            .HasMaxLength(Constants.EmailMaxLength);

        builder.Property(user => user.DateOfBirth)
            .IsRequired();

        builder.HasIndex(user => user.Username).IsUnique();
        builder.HasIndex(user => user.Email).IsUnique();

        builder.Property(user => user.PasswordHash)
            .IsRequired()
            .IsFixedLength()
            .HasMaxLength(Constants.PasswordHashMaxLength);
        
        builder.Property(user => user.PasswordSalt)
            .IsRequired()
            .IsFixedLength()
            .HasMaxLength(Constants.PasswordSaltMaxLength);

        builder.Property(user => user.Bio)
            .HasMaxLength(Constants.BioMaxLength);

        // The database default gives existing users the digest when the column is added. The sentinel is true, so EF Core
        // leaves the column out of an insert only when the value is true and always writes false; with the CLR default
        // (false) as the sentinel, a user saved with the switch off would get the database's true instead.
        builder.Property(user => user.DigestEmailEnabled)
            .HasDefaultValue(true)
            .HasSentinel(true);

        builder.Property(user => user.ResetTokenHash)
            .IsRequired(false)
            .HasMaxLength(44);

        builder.Property(user => user.ResetTokenExpiresAt)
            .IsRequired(false);

        builder.Property(user => user.AccountDeactivatedAt)
            .IsRequired(false)
            .HasDefaultValueSql("NULL");

        builder.Property(user => user.AccountDeletedAt)
            .IsRequired(false)
            .HasDefaultValueSql("NULL");

        builder.HasQueryFilter(user => user.AccountDeactivatedAt == null && user.AccountDeletedAt == null);

        builder.HasData(
            new User
            {
                Id = 1,
                Username = "sandro_beno",
                Email = "benashvilisandro91@gmail.com",
                Bio = "Admin",
                PasswordHash = "x3UgoGJFZ2X3VJBAaQyF4J+M9+gfXP6vdO1W4jNwUzQ=", // password123
                PasswordSalt = "o0wzhm224CIRy46p73NmiqjhaEtU5pyOuZ60rUHOM+g=",
                DateOfBirth = new DateTime(2000, 8, 16, 2, 3, 9, DateTimeKind.Utc),
                CreatedAt = new DateTime(2026, 9, 6, 11, 4, 0, DateTimeKind.Utc),
            }
        );
    }
}