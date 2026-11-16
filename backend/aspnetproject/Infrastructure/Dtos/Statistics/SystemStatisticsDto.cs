namespace aspnetproject.Infrastructure.Dtos.Statistics;

// An administrator's view of how big and how active the platform is.
public class SystemStatisticsDto
{
    public StatisticsTotalsDto   Totals   { get; set; } = new();
    public StatisticsActivityDto Activity { get; set; } = new();

    // Users with at least one live hub connection, however many connections each one has.
    public int OnlineUsers { get; set; }
}
