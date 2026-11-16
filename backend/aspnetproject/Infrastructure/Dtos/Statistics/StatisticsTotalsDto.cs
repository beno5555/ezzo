namespace aspnetproject.Infrastructure.Dtos.Statistics;

// Every row counts whatever its moderation status. A soft-deleted account is neither active nor deactivated.
public class StatisticsTotalsDto
{
    public int ActiveAccounts      { get; set; }
    public int DeactivatedAccounts { get; set; }
    public int Posts               { get; set; }
    public int Comments            { get; set; }
    public int Messages            { get; set; }
    public int Likes               { get; set; }
    public int PendingReports      { get; set; }
}
