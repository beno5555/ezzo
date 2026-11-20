using System.Collections.Concurrent;
using aspnetproject.Infrastructure.Dtos.Auth.Email;
using aspnetproject.Infrastructure.Services.Helpers;
using Microsoft.Extensions.Options;

namespace aspnetproject.IntegrationTests.Helpers;

// Stands in for the backend's EmailSender on every test host: each email is recorded here, reported as sent, and never
// opens an SMTP connection. A test reads Emails to check what a flow sent, such as the link in a reactivation email.
public sealed class EmailRecorder : EmailSender
{
    private readonly ConcurrentQueue<RecordedEmail> _emails = new();

    public EmailRecorder() : base(Options.Create(new EmailConfiguration { Enabled = false }))
    {
    }

    public IReadOnlyList<RecordedEmail> Emails => _emails.ToList();

    public override Task<bool> SendAsync(string to, string subject, string body)
    {
        _emails.Enqueue(new RecordedEmail
        {
            To      = to,
            Subject = subject,
            Body    = body
        });

        return Task.FromResult(true);
    }
}
