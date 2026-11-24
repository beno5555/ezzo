using aspnetproject.Common.ProjectConstants;
using aspnetproject.Data.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace aspnetproject.Data.Configurations;

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.ToTable("Messages");
        builder.HasKey(message => message.Id);

        builder.Property(message => message.MessageContent)
            .IsRequired()
            .HasMaxLength(Constants.MessageMaxLength);

        builder.Property(message => message.SeenAt)
            .HasDefaultValue(null);

        builder.HasIndex(message => new { message.SenderUserId, message.ReceiverUserId, message.CreatedAt });
        
        // The background purge deletes messages sent or received by the user before deleting the user row.
        builder.HasOne(message => message.SenderUser)
            .WithMany()
            .HasForeignKey(message => message.SenderUserId)
            .OnDelete(DeleteBehavior.NoAction)
            .IsRequired(false);
        
        builder.HasOne(message => message.ReceiverUser)
            .WithMany()
            .HasForeignKey(message => message.ReceiverUserId)
            .OnDelete(DeleteBehavior.NoAction)
            .IsRequired(false);
    }
}